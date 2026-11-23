import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from './support/create-test-app';

describe('Banco de testes', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('a aplicação de teste usa o banco chat_test com as migrações rodadas', async () => {
    const dataSource = app.get(DataSource);

    const [row] = await dataSource.query<
      { database: string; migrations: string | null }[]
    >(
      `SELECT current_database() AS database, to_regclass('public.migrations') AS migrations`,
    );

    expect(row).toEqual({ database: 'chat_test', migrations: 'migrations' });
  });
});
