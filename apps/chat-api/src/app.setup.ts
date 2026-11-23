import { INestApplication } from '@nestjs/common';

const API_PREFIX = 'v1';

/** Configuração da aplicação que vale igual no `main.ts` e no `createTestApp()`. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
}
