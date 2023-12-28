import { Env } from '@/shared/env';

export default [
  {
    url: `http://localhost:${Env.get('PORT')}`,
    description: 'Local server',
  },
];
