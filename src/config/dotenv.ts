import './module-alias';

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

import { Logger } from '@/shared';

const rootPath = process.cwd();
const environment = process.env.NODE_ENV;
const envFileName = `.env.${environment}`;

let envFinalPath = resolve(rootPath, envFileName);
if (environment !== 'test' && !existsSync(envFinalPath)) {
  envFinalPath = resolve(rootPath, '.env');
}

const checkEnvFile =
  process.env.CHECK_ENVFILE === 'true' || environment === 'test';
if (checkEnvFile && !existsSync(envFinalPath)) {
  throw new Error(`File ${envFinalPath} doest not exists.`);
}

config({
  path: envFinalPath,
  encoding: 'utf-8',
});

Logger.info(`environment loaded with ${environment}`);
