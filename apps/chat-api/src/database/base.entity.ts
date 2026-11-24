import { randomUUIDv7 } from 'node:crypto';
import {
  BeforeInsert,
  CreateDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Base das entidades do Banco do chat: id UUID v7 gerado na aplicação (ADR 0022) e as datas de
 * criação e de alteração. Inserção fora do `save` (`insert`, QueryBuilder) gera o id com
 * `randomUUIDv7()` também.
 */
export abstract class BaseEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @BeforeInsert()
  protected assignId(): void {
    this.id ||= randomUUIDv7();
  }
}
