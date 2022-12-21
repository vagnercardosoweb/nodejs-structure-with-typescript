import { Router } from 'express';

import { HttpStatusCode } from '@/enums';

import { Route } from '../../global';

const sendStatusOk = (_: any, r: any) => r.sendStatus(HttpStatusCode.OK);

const appRoutes: Route[] = [
  {
    path: '/',
    public: true,
    handler: async (request, response) => {
      return response.json({
        date: new Date().toISOString(),
        ipAddress: request.ip,
        agent: request.header('User-Agent'),
      });
    },
  },
  {
    path: '/favicon.ico',
    public: true,
    handler: sendStatusOk,
  },
  {
    path: '/sw.js',
    public: true,
    handler: sendStatusOk,
  },
];

export const makeDefaultRoutes = () => {
  const router = Router({
    strict: true,
    mergeParams: true,
    caseSensitive: false,
  });

  return router;
};

export default appRoutes;
