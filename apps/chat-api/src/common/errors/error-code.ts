import { HttpStatus } from '@nestjs/common';

/** Códigos estáveis do contrato de erro, na extensão `code` do problem+json. */
export type ErrorCode =
  | 'validation_failed'
  | 'not_found'
  | 'payload_too_large'
  | 'request_rejected'
  | 'internal_error';

/** Status de cada código. `request_rejected` vindo de uma `HttpException` mantém o status dela. */
export const ERROR_STATUS: Record<ErrorCode, HttpStatus> = {
  validation_failed: HttpStatus.BAD_REQUEST,
  not_found: HttpStatus.NOT_FOUND,
  payload_too_large: HttpStatus.PAYLOAD_TOO_LARGE,
  request_rejected: HttpStatus.BAD_REQUEST,
  internal_error: HttpStatus.INTERNAL_SERVER_ERROR,
};
