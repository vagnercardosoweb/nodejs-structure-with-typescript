import { Env } from '@/shared';

const swaggerServers = [
  {
    url: `http://localhost:${Env.get('PORT')}`,
    description: 'Local server',
  },
];

export default swaggerServers;
