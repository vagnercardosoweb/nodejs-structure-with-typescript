import { Env } from '@/shared';

export default [
  {
    url: `http://localhost:${Env.get('PORT')}`,
    description: 'Local server',
  },
];
