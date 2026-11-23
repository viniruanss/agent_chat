import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

export type Env = z.infer<typeof envSchema>;

/** Valida o ambiente; a mensagem do erro lista cada variável inválida pelo nome. */
export function parseEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Configuração inválida da API do chat:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

/** Para quem roda fora do Nest, como a CLI do TypeORM. É o único ponto que lê `process.env`. */
export function loadEnv(): Env {
  return parseEnv(process.env);
}
