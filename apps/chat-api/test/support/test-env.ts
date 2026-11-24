import { requireEnv } from './require-env';

// Roda antes de cada arquivo de teste e2e: a aplicação de teste conecta no banco de testes.
process.env.DATABASE_URL = requireEnv('TEST_DATABASE_URL');
