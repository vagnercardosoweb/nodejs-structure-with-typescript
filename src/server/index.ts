import 'reflect-metadata';

import '../config/dotenv';
import '../config/module-alias';

import httpGraceFullShutdown from 'http-graceful-shutdown';

import { Database } from '@/database';
import { ExitStatus, NodeEnv } from '@/enums';
import { parseErrorToObject } from '@/errors';
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
  Logger.error(`server exited with ${withStatus}`);
});

const onShutdown = (app: App) => {
  return async (code: any) => {
    try {
      await app.closeServer();
      await Redis.getInstance().close();
      await Database.getInstance().close();
    } catch (error: any) {
      Logger.error(`server shutdown error`, parseErrorToObject(error));
    } finally {
      process.exit(code);
    }
  };
};

(async (): Promise<void> => {
  const app = new App();
  try {
    await Redis.getInstance().connect();
    await Database.getInstance().connect();
    createSwapperDoc(app);
    const server = await app.createServer();
    httpGraceFullShutdown(server, {
      signals: 'SIGINT SIGTERM SIGQUIT',
      development: Env.get('NODE_ENV') !== NodeEnv.PRODUCTION,
      onShutdown: onShutdown(app),
      forceExit: true,
    });
    Logger.info(`server started on port ${app.getPort()}`);
  } catch (error: any) {
    Logger.error(`server started error`, parseErrorToObject(error));
    await onShutdown(app)(ExitStatus.FAILURE);
  }
})();
