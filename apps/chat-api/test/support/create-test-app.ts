import { INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';

type TestAppOptions = {
  /** Controllers só do teste, como uma rota que falha para provar a própria base. */
  controllers?: Type[];
};

/** Sobe a mesma aplicação do `main.ts`, contra o banco de testes. Feche com `app.close()`. */
export async function createTestApp(
  options: TestAppOptions = {},
): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers: options.controllers ?? [],
  }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}
