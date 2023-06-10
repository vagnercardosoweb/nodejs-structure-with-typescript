import 'reflect-metadata';

import '../config/dotenv';
import '../config/module-alias';

import { randomInt } from 'node:crypto';

import { createUserRoutes } from '@/modules/users/routes';
import { createDependencies, routes } from '@/rest-api/config';
import { Env, Logger, parseErrorToObject, SlackAlert } from '@/shared';

import { RestApi } from './rest-api';
import { createSwaggerRoute } from './swagger';

const exitId = randomInt(1_000_000_000, 9_999_999_999).toString();
const logger = Logger.withId(exitId);

const sendSlackAlert = async (color: string, message: string) => {
  if (!Env.get('SLACK_ALERT_ON_STARTED_OR_CLOSE_SERVER', true)) return;
  try {
    await SlackAlert.send({ color, fields: { exitId }, sections: { message } });
  } catch (e) {
    logger.error('SLACK_ALERT:ERROR', parseErrorToObject(e));
  }
};

(async (): Promise<void> => {
  logger.info(`server using environment ${Env.required('NODE_ENV')}`);

  const api = new RestApi(Env.required('PORT'), Env.required('APP_KEY'));
  api.addOnClose(() => sendSlackAlert('error', 'server closed'));

  try {
    await createDependencies(api);
    routes.forEach((route) => api.addRoute(route));
    createUserRoutes(api);
    createSwaggerRoute(api);
    await api.start();

    const message = `server started on port ${api.getPort()}`;
    await sendSlackAlert('success', message);
    logger.info(message);
  } catch (error: any) {
    logger.error('server started error', parseErrorToObject(error));
    await api.close();
    process.exit(1);
  }
})();

process.on('unhandledRejection', (reason, promise) => {
  const message = `server exiting due to an unhandled promise: ${promise} and reason: ${reason}`;
  logger.error(message);
  throw reason;
});

process.on('uncaughtException', async (error: any) => {
  logger.error('server received uncaught exception', parseErrorToObject(error));
  await sendSlackAlert('error', error?.message);
});
