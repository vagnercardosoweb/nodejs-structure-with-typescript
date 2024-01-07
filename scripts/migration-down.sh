#!/usr/bin/env sh

set -e

nodeEnv=${NODE_ENV:-local}
limit=${MIGRATION_LIMIT:-1}

if [ -n "$2" ]
then
  nodeEnv=$2
fi

echo "Migration down for $nodeEnv and last migration"

npm run build
node --env-file=.env."$nodeEnv" ./migrations/index.js down "$limit"

echo "Migration down done"
npm run clean
