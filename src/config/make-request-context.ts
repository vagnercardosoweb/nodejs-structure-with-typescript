import { randomUUID } from 'crypto';
import { Request } from 'express';

export const makeRequestContext = (): Request['context'] => ({
  jwt: {} as Request['context']['jwt'],
  requestId: randomUUID(),
});
