# ==========================================
# Petopia — Laravel 11 + React SPA (Vite)
# Dockerfile optimized for Render.com single Web Service deploy
# ==========================================
# Stage 1: Сборка фронтенда (React + Vite)
# ==========================================
FROM node:20-alpine AS frontend

WORKDIR /app
COPY package*.json ./
RUN npm ci

# Copy only what's needed for build to leverage cache better
COPY . .

# For production build on same-origin (SPA + API on one service):
# The JS code (axios.ts) defaults to '/api' if VITE_API_URL is not provided.
# If you ever need a full cross-origin URL at build time, pass build arg:
#   docker build --build-arg VITE_API_URL=https://your-app.onrender.com/api ...
ARG VITE_API_URL
RUN if [ -n "$VITE_API_URL" ]; then echo "VITE_API_URL=$VITE_API_URL" > .env.production; fi

RUN npm run build

# ==========================================
# Stage 2: PHP + Laravel (production runtime)
# ==========================================
FROM php:8.2-cli-alpine

# Устанавливаем системные зависимости + postgresql для pgsql + gd для изображений
RUN apk add --no-cache \
    git curl zip unzip \
    libzip-dev libpng-dev libjpeg-turbo-dev freetype-dev oniguruma-dev \
    postgresql-dev \
    supervisor nginx  # optional: if you later switch from artisan serve to full stack

# Устанавливаем PHP расширения (включая pdo_pgsql)
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip

# Устанавливаем Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Копируем весь проект (в production .dockerignore сильно уменьшит размер образа)
COPY . .

# Копируем собранный фронтенд (assets + PWA manifest/sw)
COPY --from=frontend /app/public/build ./public/build

# Устанавливаем PHP зависимости (production)
RUN composer install --no-dev --optimize-autoloader

# Базовые права (entrypoint усилит)
RUN chown -R root:root /var/www/html/storage /var/www/html/bootstrap/cache || true
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache || true

# Entrypoint (handles migrate, cache, scheduler background, PORT, persistent uploads symlinks)
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

ENTRYPOINT ["entrypoint"]

# Render will use the $PORT env var (usually 10000). We bind dynamically in entrypoint.
# EXPOSE is just documentation.
EXPOSE 8000