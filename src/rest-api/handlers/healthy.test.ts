import supertest from 'supertest';
import { describe, it } from 'vitest';

import { environments } from '@/config/environments';
import { RestApi } from '@/rest-api/rest-api';
import { HttpStatusCode, NodeEnv } from '@/shared/enums';
import { createRestApi } from '@/tests/rest-api';

describe('rest-api/handlers/healthy', () => {
  let restApi: RestApi;
  const path = '/healthy';

  beforeEach(async () => {
    restApi = await createRestApi();
  });

  afterEach(async () => {
    await restApi.close();
  });

  it(`should return "200" in the request for "${path}"`, async () => {
    const response = await supertest(restApi.getExpress()).get(path);

    expect(response.status).toBe(HttpStatusCode.OK);
    expect(response.body).toEqual({
      data: '🚀',
      path: `GET ${path}`,
      duration: expect.any(String),
      hostname: environments.HOSTNAME,
      environment: NodeEnv.TEST,
      ipAddress: expect.any(String),
      requestId: expect.any(String),
      timezone: environments.TZ,
      brlDate: expect.any(String),
      utcDate: expect.any(String),
    });
  });
});
