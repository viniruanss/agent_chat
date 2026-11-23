import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { STATUS_CODES } from 'node:http';
import type { Response } from 'express';
import { DomainError } from './domain.error';
import { ERROR_STATUS, ErrorCode } from './error-code';

const PROBLEM_CONTENT_TYPE = 'application/problem+json';

/** Texto fixo dos erros que não são de domínio: a mensagem da exceção pode ter detalhes internos. */
const DEFAULT_DETAIL: Record<ErrorCode, string> = {
  validation_failed: 'A requisição tem dados inválidos.',
  not_found: 'O recurso pedido não existe.',
  payload_too_large: 'O corpo da requisição é grande demais.',
  request_rejected: 'A requisição foi recusada.',
  internal_error: 'Ocorreu um erro inesperado.',
};

type Problem = { status: number; code: ErrorCode; detail: string };

/** Erro do leitor do corpo do Express (body-parser), que traz o status no próprio erro. */
type BodyParserError = Error & { status: number; type: string };

function isBodyParserError(exception: unknown): exception is BodyParserError {
  return (
    exception instanceof Error &&
    typeof (exception as Partial<BodyParserError>).status === 'number' &&
    typeof (exception as Partial<BodyParserError>).type === 'string'
  );
}

function codeForStatus(status: number): ErrorCode | null {
  if (status === 400) return 'validation_failed';
  if (status === 404) return 'not_found';
  if (status === 413) return 'payload_too_large';
  if (status >= 400 && status < 500) return 'request_rejected';
  return null;
}

/**
 * Único lugar que monta a resposta de erro: traduz o erro de domínio, a `HttpException` e o erro
 * do leitor do corpo em `application/problem+json`, e registra em log o erro inesperado.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const problem = this.toProblem(exception);
    const response = host.switchToHttp().getResponse<Response>();

    response
      .status(problem.status)
      .type(PROBLEM_CONTENT_TYPE)
      .send(
        JSON.stringify({
          type: 'about:blank',
          title: STATUS_CODES[problem.status],
          status: problem.status,
          detail: problem.detail,
          code: problem.code,
        }),
      );
  }

  private toProblem(exception: unknown): Problem {
    if (exception instanceof DomainError) {
      return {
        status: ERROR_STATUS[exception.code],
        code: exception.code,
        detail: exception.message,
      };
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : isBodyParserError(exception)
          ? exception.status
          : null;
    const code = status === null ? null : codeForStatus(status);
    if (status !== null && code !== null) {
      return { status, code, detail: DEFAULT_DETAIL[code] };
    }

    this.logger.error('Erro inesperado na requisição', exception);
    return {
      status: ERROR_STATUS.internal_error,
      code: 'internal_error',
      detail: DEFAULT_DETAIL.internal_error,
    };
  }
}
