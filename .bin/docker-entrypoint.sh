#!/usr/bin/env sh

echo "Copying env file..."
if [ ! -f .env ]; then
  cp .env.example .env
fi

echo "Installing node_modules..."
if [ ! -d node_modules ]; then
  npm install --silent
fi

echo "Running dev server..."
npm run dev
