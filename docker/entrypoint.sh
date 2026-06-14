#!/bin/sh
set -e

echo "==> Clearing old config cache..."
php artisan config:clear

echo "=== DEBUG: Checking environment variables ==="
echo "DB_HOST=$DB_HOST"
echo "DB_DATABASE=$DB_DATABASE"
echo "DB_USERNAME=$DB_USERNAME"
echo "DB_PORT=$DB_PORT"
echo "DATABASE_URL=$DATABASE_URL"
echo "=== END DEBUG ==="

echo "==> Caching fresh config from environment variables..."
php artisan config:cache

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Starting server..."
exec php artisan serve --host=0.0.0.0 --port=8000