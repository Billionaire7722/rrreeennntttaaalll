#!/bin/sh
set -e

if [ "$1" != "" ]; then
  exec "$@"
fi

echo "Starting NestJS app..."
exec node dist/src/main
