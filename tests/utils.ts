import '../src/config/dotenv';

import { NextFunction, Request, Response } from 'express';
import supertest from 'supertest';

import { Database } from '@/database';
import { App } from '@/server/app';

const app = new App();
const expressApp = app.getApp();

export const makeServerSupertest = () => {
  return supertest(app.getServer());
};

export const makeAppSupertest = async (withRoutes = false) => {
  app.registerHandlers();
  if (withRoutes) {
    await app.registerRoutes();
    app.registerErrorHandlers();
  }
  return supertest(expressApp);
};

export const truncateTables = async (schema?: string) => {
  const tables = await Database.getInstance().query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = '${
      schema || 'public'
    }'`,
  );

  for await (const table of tables) {
    await Database.getInstance().query(
      `TRUNCATE TABLE ${table.tablename} CASCADE;`,
    );
  }
};

(() => {
  expressApp.use((request: Request, _: Response, next: NextFunction) => {
    request.headers.authorization = `Bearer ${process.env.API_KEY}`;
    return next();
  });
})();
