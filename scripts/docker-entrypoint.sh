#!/usr/bin/env sh

echo "Checking exist env file..."
if [ ! -f .env.local ]; then
  echo "Copying env file..."
  cp .env.example .env.local
fi

directory="$(pwd)/node_modules"
echo "Checking exist $directory..."
if [ ! -d "$directory" ]; then
 echo "Install node_modules..."
 npm install --silent
fi

echo "Running dev server..."
npm run dev