# ==========================================
# Stage 1: Build frontend (React + Vite)
# ==========================================
FROM node:20-alpine AS frontend

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==========================================
# Stage 2: PHP + Nginx + Supervisor
# ==========================================
FROM php:8.2-fpm-alpine

# Устанавливаем системные зависимости
RUN apk add --no-cache \
    nginx \
    supervisor \
    git \
    curl \
    zip \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    oniguruma-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Устанавливаем Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Копируем файлы проекта
COPY . .

# Копируем собранный фронтенд из первого stage
COPY --from=frontend /app/public/build ./public/build

# Устанавливаем PHP зависимости
RUN composer install --no-dev --optimize-autoloader

# Права на папки
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Копируем конфиги Nginx и Supervisor
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]