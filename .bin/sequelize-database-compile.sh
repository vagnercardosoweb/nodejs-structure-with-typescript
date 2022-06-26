#!/usr/bin/env sh

directory="$(pwd)/node_modules"

echo "Checking if $directory folder exists..."
if [ ! -d $directory ]; then
  echo "Install node_modules..."
  npm install
fi

npm run db:compile
echo "Compiled database successfully!"
