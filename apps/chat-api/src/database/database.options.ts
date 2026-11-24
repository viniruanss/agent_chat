import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { PostgresDataSourceOptions } from 'typeorm/driver/postgres/PostgresDataSourceOptions';

/** Opções comuns à aplicação e à CLI do TypeORM, para as duas gerarem o mesmo schema. */
export function buildDataSourceOptions(
  databaseUrl: string,
): PostgresDataSourceOptions {
  return {
    type: 'postgres',
    url: databaseUrl,
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: false,
  };
}
