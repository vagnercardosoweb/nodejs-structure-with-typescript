import 'reflect-metadata';
import httpGraceFullShutdown from 'http-graceful-shutdown';

import '../config/module-alias';
import '@/config/dotenv';

import { Database } from '@/database';
import { ExitStatus } from '@/enums';
import { App } from '@/server/app';
import { Jwt, Logger, Redis } from '@/utils';

process.on('unhandledRejection', (reason, promise) => {
  Logger.error(
    `server exiting due to an unhandled promise: ${promise} and reason: ${reason}`,
  );
  throw reason;
});

process.on('uncaughtException', (error) => {
  Logger.error('server exiting due to an uncaught exception', {
    stack: error.stack,
  });
  process.exit(ExitStatus.FAILURE);
});

process.on('exit', (code) => {
  Logger.info(`server exited with ${code === 0 ? 'success' : 'failed'}`);
});

const processExitWithError = (error: any) => {
  Logger.error(`server exited with error`, { stack: error.stack });
  process.exit(ExitStatus.FAILURE);
};

(async (): Promise<void> => {
  try {
    const app = new App();
    await Redis.getInstance().connect();
    await Database.getInstance().connect();
    const server = await app.createServer();

    console.log(
      'jwt',
      await Jwt.decode(
        await Jwt.encode({
          sub: 'aaa',
          roles: ['ADMIN'],
          permissions: ['get::/users'],
        }),
      ),
    );

    httpGraceFullShutdown(server, {
      signals: 'SIGINT SIGTERM SIGQUIT',
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

    Logger.info(`server listening on port ${app.getPort()}`);
  } catch (error: any) {
    processExitWithError(error);
  }
})();
