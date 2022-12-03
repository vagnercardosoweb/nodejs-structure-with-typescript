#!/usr/bin/env sh

directory="$(pwd)/node_modules"

echo "Checking if $directory folder exists..."
if [ ! -d "$directory" ]; then
  echo "Installing node_modules..."
  npm install --silent
fi

cp ./src/database/table-names.ts ./database/table-names.ts
npx swc ./database --config-file ./database/swcrc.json --out-dir ./database-compiled
echo "Compiled database successfully!"
