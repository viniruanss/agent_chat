import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
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

/**
 * Os `type` dos erros de cliente do leitor do corpo do Express (body-parser e raw-body). Outra
 * biblioteca pode ter erros com `status` e `type`, e eles continuam sendo inesperados.
 */
const BODY_PARSER_ERROR_TYPES = new Set([
  'charset.unsupported',
  'encoding.unsupported',
  'entity.parse.failed',
  'entity.too.large',
  'entity.verify.failed',
  'parameters.too.many',
  'request.aborted',
  'request.size.invalid',
]);

/**
 * Status aceito de um erro que não é de domínio: o da `HttpException` e o do erro do leitor do
 * corpo do Express. Qualquer outro é inesperado.
 */
function statusOf(exception: unknown): number | undefined {
  if (exception instanceof HttpException) return exception.getStatus();
  if (!(exception instanceof Error)) return undefined;
  const { status, type } = exception as Error & {
    status?: unknown;
    type?: unknown;
  };
  return typeof status === 'number' &&
    typeof type === 'string' &&
    BODY_PARSER_ERROR_TYPES.has(type)
    ? status
    : undefined;
}

/** O 400 do `ValidationPipe` e o do JSON malformado são, para o cliente, entrada inválida. */
const CODE_BY_STATUS: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'validation_failed',
  [HttpStatus.NOT_FOUND]: 'not_found',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'payload_too_large',
};

/** Outro 4xx vira `request_rejected`, mantendo o status; um 5xx é tratado como inesperado. */
function codeForStatus(status: number): ErrorCode | undefined {
  return (
    CODE_BY_STATUS[status] ??
    (status >= 400 && status < 500 ? 'request_rejected' : undefined)
  );
}

/**
 * Único lugar que monta a resposta de erro: traduz o erro de domínio, a `HttpException` e o erro
 * do leitor do corpo em `application/problem+json`, e registra em log o erro inesperado.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    if (response.headersSent) {
      // A resposta já começou a sair: não há como trocá-la por um erro, só registrar.
      this.logger.error('Erro depois do envio da resposta', exception);
      return;
    }

    const problem = this.toProblem(exception);
    response.status(problem.status).type(PROBLEM_CONTENT_TYPE).json({
      type: 'about:blank',
      title: STATUS_CODES[problem.status],
      status: problem.status,
      detail: problem.detail,
      code: problem.code,
    });
  }

  private toProblem(exception: unknown): Problem {
    if (exception instanceof DomainError) {
      return {
        status: ERROR_STATUS[exception.code],
        code: exception.code,
        detail: exception.message,
      };
    }

    const status = statusOf(exception);
    const code = status === undefined ? undefined : codeForStatus(status);
    if (status !== undefined && code !== undefined) {
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
