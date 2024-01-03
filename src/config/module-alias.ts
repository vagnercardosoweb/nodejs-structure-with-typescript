import { resolve } from 'node:path';

import { addAliases } from 'module-alias';

addAliases({
  '@':
    process.env.IS_AWS_LAMBDA === 'true'
      ? '/opt/dist'
      : resolve(__dirname, '..'),
});
