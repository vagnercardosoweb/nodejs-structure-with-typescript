#!/usr/bin/env sh

echo "Checking exist env file..."
if [ ! -f .env ]; then
  echo "Copying env file..."
  cp .env.example .env
fi

echo "Checking exist node_modules..."
if [ ! -d node_modules ]; then
  echo "Install dependencies node_modules..."
  npm install --silent
fi

echo "Running dev server..."
npm run dev
