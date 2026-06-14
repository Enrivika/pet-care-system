#!/bin/sh
set -e

echo "Running migrations..."
php artisan migrate --force

echo "Starting server..."
exec php artisan serve --host=0.0.0.0 --port=8000