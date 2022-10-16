import { addAliases } from 'module-alias';
import { join, resolve } from 'path';

const rootDir = join(__dirname, '..');
addAliases({ '@': resolve(rootDir) });
