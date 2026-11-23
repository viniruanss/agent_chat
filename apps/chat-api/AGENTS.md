# AGENTS.md — API do chat

API em NestJS. Todo comando roda no contêiner `chat-api` (`AGENTS.md` da raiz, "Execução no
Docker"), como `docker compose -f compose.yaml exec chat-api <comando>`.

## Comandos

| Comando | O que faz |
| --- | --- |
| `pnpm start:dev` | Sobe a API em modo de observação, na porta 3000 do contêiner (3001 na máquina) |
| `pnpm lint` | ESLint com o prettier, corrigindo o que dá |
| `pnpm exec tsc --noEmit` | Confere os tipos |
| `pnpm test` | Testes de unidade (`src/**/*.spec.ts`) |
| `pnpm test:int` | Testes de integração (`src/**/*.int-spec.ts`) |
| `pnpm test:e2e` | Testes de ponta a ponta (`test/**/*.e2e-spec.ts`), contra o banco de testes |
| `pnpm migration:generate migrations/<Nome>` | Gera uma migração em `migrations/` com a diferença entre as entidades e o banco |
| `pnpm migration:run` | Roda as migrações pendentes no banco da `DATABASE_URL` |
| `pnpm migration:revert` | Reverte a última migração rodada |

As migrações não rodam na subida da API: rode `pnpm migration:run` depois de puxar uma migração
nova.

## Práticas

- **Configuração:** só `src/config/` lê `process.env`, e o lint barra o resto. A API lê pelo
  `ConfigService`; o que roda fora do Nest, como a CLI do TypeORM, usa o `loadEnv()`. As variáveis
  estão no `.env.example` e no LLD, "Valores e configuração".
- **Erros e validação:** o filter global e o `ValidationPipe` ficam registrados no `AppModule`
  (`APP_FILTER` e `APP_PIPE`), e não no `main.ts`, para a aplicação de teste ser a mesma. O resto
  está em `.claude/rules/nest-api-errors.md`.
- **Prefixo e ajustes da aplicação:** tudo o que se aplica sobre a aplicação criada fica em
  `configureApp()`, de `src/app.setup.ts`, chamado pelo `main.ts` e pelo `createTestApp()`.
- **Entidades** estendem a `BaseEntity` de `src/database/`, com o id UUID v7 gerado na aplicação.

## Testes

A forma dos testes está em `.claude/rules/nest-api-testing.md`. A base fica em `test/support/`:
`createTestApp()` e `uniqueEmail()`.

A suíte e2e roda no banco `chat_test`, e não no `chat`. Ele é criado pelo script de inicialização
do Postgres (`docker/postgres/init/`) e, num volume que já existe, pelo `globalSetup` da suíte, que
conecta como o superusuário local para criá-lo e também roda as migrações nele. Os endereços vêm
de `TEST_DATABASE_URL` e `TEST_DATABASE_ADMIN_URL`, no `compose.yaml`. Detalhes no LLD, "Ambiente
de desenvolvimento".

## Verificação completa

```bash
docker compose -f compose.yaml exec chat-api pnpm lint
docker compose -f compose.yaml exec chat-api pnpm exec tsc --noEmit
docker compose -f compose.yaml exec chat-api pnpm test
docker compose -f compose.yaml exec chat-api pnpm test:int
docker compose -f compose.yaml exec chat-api pnpm test:e2e
```
