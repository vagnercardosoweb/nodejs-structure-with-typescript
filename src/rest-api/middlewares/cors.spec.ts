import express from 'express';
import supertest from 'supertest';
import { describe, it } from 'vitest';

import { cors as configCors } from '@/config/cors';
import { cors } from '@/rest-api/middlewares';

describe('rest-api/middlewares/cors', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(cors);
  });

  it('should validate the headers that were defined for cors', async () => {
    app.get('/', (_, res) => res.end());
    await supertest(app)
      .get('/')
      .expect('Access-Control-Allow-Origin', configCors.origin)
      .expect('Access-Control-Allow-Methods', configCors.methods.join(','))
      .expect('Access-Control-Allow-Headers', configCors.headers.join(','))
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect(200);
  });

  it('should validate the header when the method is "OPTIONS"', async () => {
    app.get('/', (_, res) => res.end());
    await supertest(app)
      .options('/')
      .expect('Access-Control-Allow-Origin', configCors.origin)
      .expect('Access-Control-Allow-Methods', configCors.methods.join(','))
      .expect('Access-Control-Allow-Headers', configCors.headers.join(','))
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect('Content-Length', '0')
      .expect(204);
  });
});
