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
FROM php:8.2-cli-alpine

# Устанавливаем системные зависимости (исправленная версия)
RUN apk add --no-cache \    
    git \
    curl \
    zip \
    unzip \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    libxml2-dev

# Настраиваем и устанавливаем PHP расширения
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Устанавливаем Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Копируем проект
COPY . .

# Копируем собранный фронтенд
COPY --from=frontend /app/public/build ./public/build

# Устанавливаем PHP зависимости
RUN composer install --no-dev --optimize-autoloader

# Права
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Копируем конфиги
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]