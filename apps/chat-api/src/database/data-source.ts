import { DataSource } from 'typeorm';
import { loadEnv } from '../config/env.schema';
import { buildDataSourceOptions } from './database.options';

/** DataSource da CLI do TypeORM (`migration:*`), que roda fora do Nest. */
export default new DataSource({
  ...buildDataSourceOptions(loadEnv().DATABASE_URL),
  entities: ['src/**/*.entity.ts'],
  migrations: ['migrations/*.ts'],
});
