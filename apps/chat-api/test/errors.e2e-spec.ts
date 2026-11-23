import { Controller, Get, INestApplication, Logger } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './support/create-test-app';

const INTERNAL_DETAIL = 'senha do banco: s3cr3t';

@Controller('test-failure')
class FailingController {
  @Get()
  fail(): never {
    throw new Error(INTERNAL_DETAIL);
  }
}

describe('Erros da API', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp({ controllers: [FailingController] });
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('responde 404 em problem+json com o code not_found numa rota inexistente', async () => {
    const response = await request(app.getHttpServer()).get(
      '/v1/rota-inexistente',
    );

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(
      /^application\/problem\+json/,
    );
    expect(response.body).toMatchObject({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      code: 'not_found',
    });
  });

  it('responde 500 sem a mensagem interna nem stack trace e registra o erro em log', async () => {
    const logError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const response = await request(app.getHttpServer()).get('/v1/test-failure');

    expect(response.status).toBe(500);
    expect(response.headers['content-type']).toMatch(
      /^application\/problem\+json/,
    );
    expect(response.body).toMatchObject({
      status: 500,
      code: 'internal_error',
    });
    expect(response.text).not.toContain(INTERNAL_DETAIL);
    expect(response.text).not.toContain('errors.e2e-spec');
    expect(logError).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ message: INTERNAL_DETAIL }),
    );
  });
});
