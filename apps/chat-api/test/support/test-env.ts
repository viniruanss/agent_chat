// Roda antes de cada arquivo de teste e2e: a aplicação de teste conecta no banco de testes.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    'TEST_DATABASE_URL não está definida no ambiente dos testes.',
  );
}
process.env.DATABASE_URL = testDatabaseUrl;
