#!/usr/bin/env sh

. "$(dirname "$0")/sequelize-database-compile.sh"

npx sequelize-cli db:migrate
echo "Migrated database successfully!"

rm -rf ./database-compiled
echo "Removed database-compiled folder successfully!"
