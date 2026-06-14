#!/bin/sh
set -e

echo "==> Petopia entrypoint starting (Render.com compatible)..."

# Render provides $PORT, default to 8000 for local Docker
PORT=${PORT:-8000}

echo "==> Clearing old config cache..."
php artisan config:clear || true

echo "=== DEBUG: Checking environment variables ==="
echo "DB_HOST=$DB_HOST"
echo "DB_DATABASE=$DB_DATABASE"
echo "DB_USERNAME=$DB_USERNAME"
echo "DB_PORT=$DB_PORT"
echo "DATABASE_URL=$DATABASE_URL"
echo "APP_URL=$APP_URL"
echo "PORT=$PORT"
echo "=== END DEBUG ==="

echo "==> Caching fresh config, routes and views..."
php artisan config:cache
php artisan route:cache || true
php artisan view:cache || true

echo "==> Running migrations (force in production)..."
php artisan migrate --force

# Prepare upload directories for pet photos and avatars.
# These are written directly to public/ subfolders in PetController / AuthController.
# To persist uploads across deploys/restarts on Render:
#   1. Attach a Persistent Disk in Render dashboard (e.g. mount path: /var/www/html/persistent , size 1GB+)
#   2. The entrypoint will create symlinks so /images_pets and /users point to the disk.
# If no disk is attached, uploads live in the ephemeral container filesystem (lost on redeploy).
PERSISTENT_DIR=${PERSISTENT_DIR:-/var/www/html/persistent}
echo "==> Preparing persistent upload directories (disk recommended)..."
mkdir -p "$PERSISTENT_DIR/images_pets" "$PERSISTENT_DIR/users" public/images_pets public/users storage/logs storage/app storage/framework/cache storage/framework/sessions storage/framework/views
# Create (or update) symlinks so code writing to public/images_pets still works + served statically
ln -sfn "$PERSISTENT_DIR/images_pets" public/images_pets
ln -sfn "$PERSISTENT_DIR/users" public/users

# Fix permissions (Render container often runs as root)
chown -R root:root /var/www/html/storage /var/www/html/bootstrap/cache public/images_pets public/users || true
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache || true

echo "==> Starting background scheduler (every minute for reminders + overdue tasks)..."
# Run Laravel scheduler in a loop (since we are single Web Service, no separate worker).
# Output goes to stdout so Render logs capture it.
(while true; do
  php artisan schedule:run --no-interaction --verbose >> /proc/1/fd/1 2>&1 || true
  sleep 60
done) &

echo "==> Starting PHP built-in server on 0.0.0.0:$PORT (for production consider switching to nginx+fpm)..."
exec php artisan serve --host=0.0.0.0 --port="$PORT"