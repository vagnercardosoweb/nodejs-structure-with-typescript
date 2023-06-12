import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config } from 'dotenv';

const rootPath = process.cwd();
const environment = process.env.NODE_ENV || 'local';
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

config({ path: envFinalPath, encoding: 'utf-8' });
