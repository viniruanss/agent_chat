import { randomUUID } from 'node:crypto';

/** E-mail único por chamada, para cada teste criar os próprios dados. */
export function uniqueEmail(prefix = 'pessoa'): string {
  return `${prefix}-${randomUUID()}@teste.local`.toLowerCase();
}
