import '../config/module-alias';

import { environments } from '@/config/environments';
import { setupDependencies } from '@/rest-api/dependencies';
import { setupHandlers } from '@/rest-api/handlers';
import { RestApi } from '@/rest-api/rest-api';
import { setupSwagger } from '@/rest-api/swagger';
import { parseErrorToObject } from '@/shared/errors';
import { SlackAlert } from '@/shared/slack-alert';

const restApi = new RestApi(environments.PORT, environments.APP_KEY);
const logger = restApi.getLogger();

const sendSlackAlert = async (color: string, message: string) => {
  if (!environments.SLACK_ALERT_ON_STARTED_OR_CLOSE_SERVER) return;
  try {
    await SlackAlert.send({ color, sections: { message } });
  } catch (e: any) {
    logger.error('SLACK_ALERT_ERROR', parseErrorToObject(e));
  }
};

const onShutdown = (error?: any) => {
  return async (code = 'SIGTERM') => {
    try {
      let message = `server exited with code "${code}"`;

      if (error) error = parseErrorToObject(error);
      logger.error(message, error);

      if (error?.message) message = `${message}: ${error.message}`;
      await sendSlackAlert('error', message);

      await restApi.close();
    } finally {
      process.exit(1);
    }
  };
};

(async (): Promise<void> => {
  process.env.TZ = 'UTC';
  logger.info(`using environment "${environments.NODE_ENV}"`);

  try {
    await setupDependencies(restApi);
    setupHandlers(restApi);
    setupSwagger(restApi);
    await restApi.listen();

    const message = `server started on port "${restApi.getPort()}"`;
    await sendSlackAlert('success', message);
    logger.info(message);
  } catch (error: any) {
    await onShutdown(error)();
  }
})();

process.on('unhandledRejection', async (reason, promise) => {
  const message = `server exiting due to an "unhandledRejection": ${reason}`;
  logger.error(message, { reason, promise });
  await sendSlackAlert('error', message);
  process.exit(1);
});

process.on('uncaughtException', async (error: any) => {
  const message = `server received "uncaughtException": ${error.message}`;
  logger.error(message, parseErrorToObject(error));
  await sendSlackAlert('error', message);
  process.exit(1);
});

process.on('SIGTERM', onShutdown());
process.on('SIGINT', onShutdown());
