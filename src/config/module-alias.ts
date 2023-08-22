import { join, resolve } from 'node:path';

import { addAliases } from 'module-alias';

const rootDir = join(__dirname, '..');
addAliases({ '@': resolve(rootDir) });
