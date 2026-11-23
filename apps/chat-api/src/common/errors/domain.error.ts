import { ErrorCode } from './error-code';

/**
 * Erro de uma regra de negócio violada. Carrega o `code` do contrato e uma mensagem para pessoas,
 * que vai para o `detail` da resposta; não sabe o status HTTP, que é decidido pelo filter.
 */
export abstract class DomainError extends Error {
  abstract readonly code: ErrorCode;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
