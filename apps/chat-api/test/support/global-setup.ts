import { execFileSync } from 'node:child_process';
import { Client } from 'pg';
import { requireEnv } from './require-env';

/**
 * Cria o banco de testes quando ele falta, como num volume do Postgres anterior ao script de
 * inicialização, e roda as migrações nele. Conecta como o superusuário local, porque o papel
 * `chat` não tem `CREATEDB`.
 */
export default async function globalSetup(): Promise<void> {
  const testDatabaseUrl = requireEnv('TEST_DATABASE_URL');
  const url = new URL(testDatabaseUrl);

  const admin = new Client({
    connectionString: requireEnv('TEST_DATABASE_ADMIN_URL'),
  });
  await admin.connect();
  try {
    const databaseName = url.pathname.slice(1);
    const existing = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );
    if (existing.rowCount === 0) {
      const database = admin.escapeIdentifier(databaseName);
      const owner = admin.escapeIdentifier(decodeURIComponent(url.username));
      await admin.query(`CREATE DATABASE ${database} OWNER ${owner}`);
      await admin.query(`REVOKE CONNECT ON DATABASE ${database} FROM PUBLIC`);
      await admin.query(`GRANT CONNECT ON DATABASE ${database} TO ${owner}`);
    }
  } finally {
    await admin.end();
  }

  // Processo filho: a CLI carrega as migrações .ts sozinha, sem depender do Jest. Os tipos já
  // são conferidos pelo tsc da verificação, então a CLI só transpila.
  execFileSync('pnpm', ['migration:run'], {
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
      TS_NODE_TRANSPILE_ONLY: 'true',
    },
    stdio: 'inherit',
  });
}
