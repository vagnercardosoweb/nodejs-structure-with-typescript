#!/usr/bin/env sh

echo "Copying env file..."
if [ ! -f ".env" ]; then
  cp .env.example .env
fi

echo "Installing node_modules..."
npm install --silent

echo "Running dev server..."
npm run dev
