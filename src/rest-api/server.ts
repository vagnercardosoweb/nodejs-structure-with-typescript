import '../config/module-alias';

import process from 'node:process';

import { setupDependencies } from '@/rest-api/dependencies';
import { RestApi } from '@/rest-api/rest-api';
import { routes } from '@/rest-api/routes';
import { Env, Logger, parseErrorToObject, SlackAlert } from '@/shared';

const sendSlackAlert = async (color: string, message: string) => {
  if (!Env.get('SLACK_ALERT_ON_STARTED_OR_CLOSE_SERVER', true)) return;
  try {
    await SlackAlert.send({ color, sections: { message } });
  } catch (e) {
    Logger.error('SLACK_ALERT_ERROR', parseErrorToObject(e));
  }
};

(async (): Promise<void> => {
  process.env.TZ = Env.getTimezoneUtc();
  Logger.info(`using environment ${Env.required('NODE_ENV')}`);

  const restApi = new RestApi(Env.required('PORT'), Env.required('APP_KEY'));
  restApi.beforeClose(() => sendSlackAlert('error', 'server closed'));

  try {
    await setupDependencies(restApi);
    routes.forEach((route) => restApi.addRoute(route));
    await restApi.listen();

    const message = `server started on port ${restApi.getPort()}`;
    await sendSlackAlert('success', message);
    Logger.info(message);
  } catch (error: any) {
    Logger.error('server started error', parseErrorToObject(error));
    await restApi.close();
    process.exit(1);
  }
})();

process.on('unhandledRejection', (reason, promise) => {
  const message = `server exiting due to an unhandled promise: ${promise} and reason: ${reason}`;
  Logger.error(message);
  throw reason;
});

process.on('uncaughtException', async (error: any) => {
  Logger.error('server received uncaught exception', parseErrorToObject(error));
  await sendSlackAlert('error', error?.message);
});
