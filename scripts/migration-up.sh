#!/usr/bin/env sh

set -e

nodeEnv=${NODE_ENV:-local}

if [ -n "$1" ]
then
  nodeEnv=$1
fi

echo "Migration up for $nodeEnv"

npm run build
node --env-file=.env."$nodeEnv" ./migrations/index.js up

echo "Migration up done"
npm run clean
