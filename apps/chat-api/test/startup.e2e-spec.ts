import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const API_ROOT = join(__dirname, '..');

describe('Subida da API', () => {
  it('a API não sobe sem DATABASE_URL e diz o nome da variável', () => {
    const env = { ...process.env };
    delete env.DATABASE_URL;

    const result = spawnSync(
      process.execPath,
      ['-r', 'ts-node/register/transpile-only', 'src/main.ts'],
      { cwd: API_ROOT, env, encoding: 'utf8', timeout: 30_000 },
    );

    expect(result.status).not.toBe(0);
    expect(result.status).not.toBeNull();
    expect(result.stderr).toContain('DATABASE_URL');
    expect(result.stdout).not.toContain(
      'Nest application successfully started',
    );
  });
});
