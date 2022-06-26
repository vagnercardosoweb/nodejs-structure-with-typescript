#!/usr/bin/env sh

echo "Copying env file..."
if [ ! -f ".env" ]; then
  cp .env.example .env
fi

echo "Install node_modules..."
npm install

echo "Running dev server"
npm run dev
