#!/usr/bin/env sh

set -e

MIGRATION_LIMIT=-1 "$(dirname "$0")"/migration-down.sh
