import { execFileSync } from 'node:child_process';
import { Client } from 'pg';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} não está definida no ambiente dos testes.`);
  }
  return value;
}

/**
 * Cria o banco de testes quando ele falta, como num volume do Postgres anterior ao script de
 * inicialização, e roda as migrações nele. Conecta como o superusuário local, porque o papel
 * `chat` não tem `CREATEDB`.
 */
export default async function globalSetup(): Promise<void> {
  const testDatabaseUrl = requireEnv('TEST_DATABASE_URL');
  const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
  const owner = decodeURIComponent(new URL(testDatabaseUrl).username);

  const admin = new Client({
    connectionString: requireEnv('TEST_DATABASE_ADMIN_URL'),
  });
  await admin.connect();
  try {
    const existing = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );
    if (existing.rowCount === 0) {
      const database = admin.escapeIdentifier(databaseName);
      await admin.query(
        `CREATE DATABASE ${database} OWNER ${admin.escapeIdentifier(owner)}`,
      );
      await admin.query(`REVOKE CONNECT ON DATABASE ${database} FROM PUBLIC`);
      await admin.query(
        `GRANT CONNECT ON DATABASE ${database} TO ${admin.escapeIdentifier(owner)}`,
      );
    }
  } finally {
    await admin.end();
  }

  // Processo filho: a CLI carrega as migrações .ts sozinha, sem depender do Jest.
  execFileSync('pnpm', ['migration:run'], {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: 'inherit',
  });
}
