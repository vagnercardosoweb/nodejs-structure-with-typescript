import { ListAllHandler } from '@/rest-api/handlers/user/list-all';
import { Route } from '@/rest-api/types';
import { HttpMethod } from '@/shared';

export const userRoutes: Route[] = [
  { path: '/users', handler: ListAllHandler, method: HttpMethod.GET },
];
