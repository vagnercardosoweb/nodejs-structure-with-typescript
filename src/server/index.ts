import 'reflect-metadata';

import '../config/dotenv';
import '../config/module-alias';

import httpGraceFullShutdown from 'http-graceful-shutdown';

import { Database } from '@/database';
import { ExitStatus, NodeEnv } from '@/enums';
import { App } from '@/server/app';
import { Env, Logger, Redis } from '@/shared';
import { createSwapperDoc } from '@/swagger';

process.on('unhandledRejection', (reason, promise) => {
  const message = `server exiting due to an unhandled promise: ${promise} and reason: ${reason}`;
  Logger.error(message);
  throw reason;
});

process.on('uncaughtException', (error) => {
  Logger.error('server exiting due to an uncaught exception', error);
  process.exit(ExitStatus.FAILURE);
});

process.on('exit', (code) => {
  const withStatus = code === ExitStatus.SUCCESS ? 'success' : 'failed';
  Logger.info(`server exited with ${withStatus}`);
});

const processExitWithError = (error: any) => {
  Logger.error(`server exited with error`, { stack: error.stack });
  process.exit(ExitStatus.FAILURE);
};

(async (): Promise<void> => {
  try {
    const app = new App();
    createSwapperDoc(app);
    const server = await app.createServer();
    httpGraceFullShutdown(server, {
      signals: 'SIGINT SIGTERM SIGQUIT',
      development: Env.get('NODE_ENV') !== NodeEnv.PRODUCTION,
      forceExit: true,
      onShutdown: async (code) => {
        Logger.info(`server received signal ${code}`);
        try {
          Logger.info('closing server');
          await app.closeServer();
          await Redis.getInstance().close();
          await Database.getInstance().close();
          process.exit(ExitStatus.SUCCESS);
        } catch (error) {
          processExitWithError(error);
        }
      },
    });
    await Redis.getInstance().connect();
    await Database.getInstance().connect();
    Logger.info(`server listening on port ${app.getPort()}`);
  } catch (error: any) {
    processExitWithError(error);
  }
})();
