import { Request } from 'express';

export const makeRequestContext = () =>
  ({
    jwt: {},
  } as Request['context']);
