import './default-env';

import { Environment } from 'vitest';

import { setupPostgres, setupRedis } from '@/tests/containers';

export default <Environment>{
  name: 'e2e',
  transformMode: 'ssr',
  setup: async () => {
    const postgres = await setupPostgres();
    const redis = await setupRedis();

    return {
      teardown: async () => {
        process.nextTick(async () => {
          await postgres.stop();
          await redis.stop();
        });
      },
    };
  },
};
