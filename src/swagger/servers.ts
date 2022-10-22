import { Env } from '@/shared';

const swaggerServers = [
  {
    url: `http://localhost:${Env.get('PORT', 3333)}`,
    description: 'Local server',
  },
];

export default swaggerServers;
