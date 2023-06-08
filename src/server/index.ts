import 'reflect-metadata';

import '../config/dotenv';
import '../config/module-alias';

import { randomInt } from 'crypto';
import httpGraceFullShutdown from 'http-graceful-shutdown';

import { Database } from '@/database';
import { ExitStatus } from '@/enums';
import { parseErrorToObject } from '@/errors';
import { App } from '@/server/app';
import { Env, Logger, Redis, Slack } from '@/shared';
import { createSwapperDoc } from '@/swagger';

const exitId = randomInt(1_000_000_000, 9_999_999_999).toString();

const sendSlackAlertError = async (code: any, error: any) => {
  if (Env.isLocal()) return;
  try {
    await Slack.sendMessage({
      color: code === ExitStatus.SUCCESS ? 'warning' : 'error',
      fields: { exitId },
      sections: {
        message: `server exited with signal code: ${code}`,
        description: error,
      },
    });
  } catch (e) {
    Logger.error('send alert error slack error', parseErrorToObject(e));
  }
};

process.on('unhandledRejection', (reason, promise) => {
  const message = `server exiting due to an unhandled promise: ${promise} and reason: ${reason}`;
  Logger.error(message, { exitId });
  throw reason;
});

process.on('uncaughtException', async (error: any) => {
  error.exitId = exitId;
  Logger.error('server received uncaught exception', parseErrorToObject(error));
  await sendSlackAlertError(ExitStatus.FAILURE, error);
});

process.on('exit', (code) => {
  const withStatus = code === ExitStatus.SUCCESS ? 'success' : 'failed';
  const message = `server exited with ${withStatus}`;
  Logger.error(message, { exitId });
});

const onShutdown = (app: App, error?: any) => {
  return async (code: any) => {
    try {
      await app.closeServer();
      await Redis.getInstance().close();
      await Database.getInstance().close();
      await sendSlackAlertError(code, error);
    } catch (error: any) {
      Logger.error('server shutdown error', parseErrorToObject(error));
    } finally {
      process.exit(code);
    }
  };
};

const sendSlackAlertStartedServer = async (message: string) => {
  if (Env.isLocal()) return;
  try {
    await Slack.sendMessage({
      color: 'info',
      sections: { message },
    });
    Logger.info('sent log started to slack');
  } catch (e) {
    Logger.error('sent log started error', parseErrorToObject(e));
  }
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
      development: Env.isLocal(),
      onShutdown: onShutdown(app),
      forceExit: true,
    });
    const message = `server started on port ${app.getPort()}`;
    await sendSlackAlertStartedServer(message);
    Logger.info(message);
  } catch (error: any) {
    Logger.error(`server started error`, parseErrorToObject(error));
    await onShutdown(app, error)(ExitStatus.FAILURE);
  }
})();
