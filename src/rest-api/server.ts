import '../config/module-alias';

import { randomInt } from 'node:crypto';
import process from 'node:process';

import { setupDependencies } from '@/rest-api/dependencies';
import { RestApi } from '@/rest-api/rest-api';
import { routes } from '@/rest-api/routes';
import { Env } from '@/shared/env';
import { parseErrorToObject } from '@/shared/errors';
import { Logger } from '@/shared/logger';
import { SlackAlert } from '@/shared/slack-alert';

const restApi = new RestApi(Env.required('PORT'), Env.required('APP_KEY'));
const serverId = `V${randomInt(1_000_000_000, 9_999_999_999).toString()}C`;

const sendSlackAlert = async (color: string, message: string) => {
  if (!Env.get('SLACK_ALERT_ON_STARTED_OR_CLOSE_SERVER', true)) return;
  try {
    await SlackAlert.send({ color, sections: { message } });
  } catch (e) {
    Logger.error('SLACK_ALERT_ERROR', parseErrorToObject(e));
  }
};

const onShutdown = (error?: any) => {
  return async (code = 'SIGTERM') => {
    try {
      let message = `server exited with code "${code}" with id "${serverId}"`;
      Logger.error(message, error ? parseErrorToObject(error) : undefined);

      if (error?.message) message = `${message}: ${error.message}`;
      await sendSlackAlert('error', message);

      await restApi.close();
    } finally {
      process.exit(1);
    }
  };
};

(async (): Promise<void> => {
  process.env.TZ = Env.getTimezoneUtc();
  Logger.info(`using environment ${Env.required('NODE_ENV')}`);

  try {
    await setupDependencies(restApi);
    routes.forEach((route) => restApi.addRoute(route));
    await restApi.listen();

    const message = `server started on port "${restApi.getPort()}" with id "${serverId}"`;
    await sendSlackAlert('success', message);
    Logger.info(message);
  } catch (error: any) {
    await onShutdown(error)();
  }
})();

process.on('unhandledRejection', async (reason, promise) => {
  const message = `server exiting due to an "unhandledRejection" with id "${serverId}": ${reason}`;
  Logger.error(message, { reason, promise, serverId });
  await sendSlackAlert('error', message);
  process.exit(1);
});

process.on('uncaughtException', async (error: any) => {
  const message = `server received "uncaughtException" with id "${serverId}": ${error.message}`;
  Logger.error(message, parseErrorToObject(error));
  await sendSlackAlert('error', message);
  process.exit(1);
});

process.on('SIGTERM', onShutdown());
process.on('SIGINT', onShutdown());
