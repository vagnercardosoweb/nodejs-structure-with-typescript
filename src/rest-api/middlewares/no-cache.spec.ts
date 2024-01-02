import express from 'express';
import supertest from 'supertest';
import { describe } from 'vitest';

import { noCache } from '@/rest-api/middlewares';

describe('rest-api/middlewares/no-cache', () => {
  it('should validate the headers that were defined for no-cache', async () => {
    const app = express();
    app.use(noCache);
    app.get('/', (_, res) => res.end());
    await supertest(app)
      .get('/')
      .expect('Expires', '0')
      .expect('Pragma', 'no-cache')
      .expect('Surrogate-Control', 'no-store')
      .expect(
        'Cache-Control',
        'no-store, no-cache, max-age=0, must-revalidate, proxy-revalidate, private',
      )
      .expect(200);
  });
});
