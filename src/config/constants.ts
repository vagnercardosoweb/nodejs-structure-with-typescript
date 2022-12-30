import os from 'os';

import { Env } from '@/shared';

export const PID = process.pid;
export const HOSTNAME = os.hostname();
export const LOG_ENABLED = Env.get('LOG_ENABLED', true);
export const LOGGER_ID = Env.get('LOGGER_ID', 'APP');
export const TZ = Env.get('TZ', 'UTC');
export const IS_TESTING = Env.isTesting();
