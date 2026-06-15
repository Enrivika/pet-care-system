#!/bin/sh
set -e

echo "==> Petopia entrypoint starting (Render.com compatible)..."

# Render provides $PORT, default to 8000 for local Docker
PORT=${PORT:-8000}

# === DATABASE_URL compatibility (Render, Heroku, etc. provide DATABASE_URL) ===
# Laravel config/database.php usually looks for DB_URL.
# We map DATABASE_URL -> DB_URL if DB_URL is not explicitly set.
if [ -n "${DATABASE_URL:-}" ] && [ -z "${DB_URL:-}" ]; then
    export DB_URL="$DATABASE_URL"
    echo "==> Mapped DATABASE_URL to DB_URL for Laravel"
fi

# Auto-detect DB_CONNECTION if not set (helps when only DATABASE_URL is provided)
if [ -z "${DB_CONNECTION:-}" ] && [ -n "${DB_URL:-}" ]; then
    case "$DB_URL" in
        postgres*://*|postgresql*://*) export DB_CONNECTION=pgsql ;;
        mysql*://*)                    export DB_CONNECTION=mysql ;;
        sqlite*://*)                   export DB_CONNECTION=sqlite ;;
    esac
    if [ -n "${DB_CONNECTION:-}" ]; then
        echo "==> Auto-detected DB_CONNECTION=$DB_CONNECTION from DB_URL"
    fi
fi

echo "==> Clearing old config cache..."
php artisan config:clear || true

echo "=== DEBUG: Checking environment variables ==="
echo "DB_CONNECTION=${DB_CONNECTION:-not set}"
echo "DB_HOST=$DB_HOST"
echo "DB_DATABASE=$DB_DATABASE"
echo "DB_USERNAME=$DB_USERNAME"
echo "DB_PORT=$DB_PORT"
echo "DB_URL=${DB_URL:-not set}"
echo "DATABASE_URL=${DATABASE_URL:-not set}"
echo "APP_URL=$APP_URL"
echo "PORT=$PORT"
echo "=== END DEBUG ==="

echo "==> Caching fresh config, routes and views..."
php artisan config:cache
php artisan route:cache || true
php artisan view:cache || true

echo "==> Running migrations (force in production)..."
php artisan migrate --force --verbose

# === Upload directories handling (works on free tier without paid Persistent Disk) ===
#
# IMPORTANT for FREE tier:
# - Without attaching a paid Persistent Disk, the container filesystem is ephemeral.
# - Any files uploaded to public/images_pets or public/users will be LOST on every redeploy or container restart.
# - This is a known free-tier limitation.
#
# If you later attach a disk at /var/www/html/persistent, the code below will use it.
# For now (free) we simply ensure the directories exist under public/.

echo "==> Preparing upload directories (public/images_pets and public/users)..."

# Always ensure the public dirs exist (ephemeral fallback)
mkdir -p public/images_pets public/users

# Optional: use persistent disk if mounted (paid feature)
PERSISTENT_DIR=${PERSISTENT_DIR:-/var/www/html/persistent}
if [ -d "$PERSISTENT_DIR" ] && [ -w "$PERSISTENT_DIR" ]; then
    echo "==> Persistent disk detected at $PERSISTENT_DIR — using it for durability"
    mkdir -p "$PERSISTENT_DIR/images_pets" "$PERSISTENT_DIR/users"
    # Symlink so existing controller code (public_path('images_pets')) continues to work
    ln -sfn "$PERSISTENT_DIR/images_pets" public/images_pets || true
    ln -sfn "$PERSISTENT_DIR/users" public/users || true
else
    echo "==> No persistent disk mounted (free tier mode). Uploaded pet photos and avatars will NOT survive redeploys/restarts."
fi

# Ensure other Laravel dirs exist
mkdir -p storage/logs storage/app storage/framework/cache storage/framework/sessions storage/framework/views

# Fix permissions (Render usually runs as root)
chown -R root:root /var/www/html/storage /var/www/html/bootstrap/cache public/images_pets public/users || true
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache public/images_pets public/users || true

echo "==> Starting background scheduler (every minute for reminders + overdue tasks)..."
# Run Laravel scheduler in a loop (single Web Service, no separate worker).
# Output to stdout for Render logs.
(while true; do
  php artisan schedule:run --no-interaction --verbose >> /proc/1/fd/1 2>&1 || true
  sleep 60
done) &

echo "==> Starting PHP built-in server on 0.0.0.0:$PORT ..."
exec php artisan serve --host=0.0.0.0 --port="$PORT"