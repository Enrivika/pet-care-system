# Деплой Petopia на Render.com (единый Web Service)

## Почему единый сервис, а не отдельные frontend + backend

У тебя архитектура **Laravel + React SPA** (Vite):
- Все маршруты кроме `/api/*` отдают один Blade-шаблон `resources/views/app.blade.php`
- React (react-router-dom) делает клиентский роутинг
- API на Sanctum (Bearer токены)
- Сборка фронтенда (`npm run build`) кладёт ассеты в `public/build`
- Никакого отдельного `index.html` и отдельного сервера для React — всё через PHP/Laravel

Поэтому идеально деплоится как **один Render Web Service** (Docker).

## Что уже сделано / исправлено в этом коммите для деплоя

- Исправлен критический баг: в `routes/api.php` не хватало `use ... HealthRecordController`
- `resources/js/api/axios.ts`: дефолт изменён с `http://localhost:8000/api` на `/api` (относительный путь). Теперь при сборке без `VITE_API_URL` всё работает на одном домене.
- Улучшен `docker/entrypoint.sh`:
  - Поддержка переменной `$PORT` (Render её даёт)
  - `php artisan migrate --force`, config/route/view cache
  - Фоновый scheduler (каждую минуту): `reminders:send` + `tasks:mark-overdue`
  - Подготовка директорий для загрузок (`images_pets`, `users`) + поддержка Persistent Disk через симлинки
- Улучшен `Dockerfile`:
  - Комментарии, поддержка build-arg `VITE_API_URL` на будущее
  - `.dockerignore` создан (быстрее билды, меньше слой)
- Добавлен `render.yaml` — Blueprint для автоматического создания Web Service + Postgres
- В `bootstrap/app.php` добавлен `trustProxies(at: '*')` — обязательно для Render
- `.env.production` обновлён (VITE_API_URL=/api)

## Пошаговый план деплоя

### 1. Подготовка репозитория

```powershell
# Убедись, что все изменения закоммичены
git status
git add .
git commit -m "chore: prepare for Render.com single Web Service deploy"
git push origin main   # или твою ветку
```

> Текущий HEAD был detached — убедись, что пушится в правильную ветку на GitHub.

### 2. Создай аккаунт и подключение на Render.com

1. Зайди https://render.com → Sign up (GitHub удобно)
2. New → **Blueprint**
3. Connect repo → выбери свой pet-care-system
4. Render найдёт `render.yaml` и предложит создать:
   - `petopia-db` (Postgres free)
   - `petopia` (Web Service на Docker)

   Или создай вручную:
   - New → **Web Service**
     - Connect repo
     - Environment: **Docker**
     - Dockerfile path: `./Dockerfile`
     - Build Command / Start Command — оставь пустыми (всё в Dockerfile + entrypoint)
     - Plan: Starter (или Free для теста)

### 3. База данных (Postgres)

Рекомендуется Postgres (Render managed).

При создании через Blueprint она создастся автоматически.

Вручную:
- New → PostgreSQL
- Name: `petopia-db`
- Plan: Free
- После создания скопируй **Internal Database URL** (или Connection String)

В настройках Web Service добавь переменные окружения (или Render автоматически пробросит `DATABASE_URL` при линковке):

```
DB_CONNECTION=pgsql
# Или просто:
DATABASE_URL=postgres://user:pass@host:5432/dbname   # Render обычно даёт именно это
```

Render при линковке ресурсов часто автоматически добавляет `DATABASE_URL` и другие PG* в окружение веб-сервиса.

### 4. Обязательные переменные окружения (Web Service → Environment)

**Добавь вручную в Render Dashboard** (секреты не хранятся в git):

- `APP_KEY` — сгенерируй локально:
  ```bash
  php artisan key:generate --show
  ```
  Скопируй `base64:...` значение.

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL` — после первого деплоя будет `https://petopia.onrender.com` (или твоё кастомное). Можно задать сразу.

- `MAIL_PASSWORD` — твой Gmail App Password (не обычный пароль!)
- `VAPID_PUBLIC_KEY` и `VAPID_PRIVATE_KEY` — уже есть в .env.production (для Web Push)

Остальное (VITE_*, DB_*) можно оставить в render.yaml или добавить явно.

### 5. Persistent Disk для пользовательских загрузок (фото питомцев и аватары)

**Критично!** Без диска все загруженные фото пропадут при каждом редеплое/рестарте контейнера.

1. После создания Web Service зайди в него → **Disks** → **Add Disk**
2. Name: `uploads` (или любое)
3. Mount Path: **точно** `/var/www/html/persistent`
4. Size: 1 GB (хватает на старте)

Entrypoint автоматически:
- Создаст `/var/www/html/persistent/images_pets` и `.../users`
- Сделает симлинки в `public/images_pets` и `public/users`
- Код в контроллерах продолжит писать по старым путям `/images_pets/xxx.jpg`, файлы будут доступны по HTTP и сохранятся.

### 6. Деплой и первая миграция

- Нажми **Deploy**.
- Смотри логи (Build + Runtime).
- Entrypoint запустит `migrate --force` автоматически.
- Health check `/up` должен вернуться 200.

После успешного деплоя:
- Открой `https://<твой-сервис>.onrender.com`
- Зарегистрируйся / залогинься
- Попробуй создать питомца с фото — убедись, что фото сохранилось (и не пропадёт после следующего деплоя).

### 7. Дополнительно

**Кастомный домен**:
- В Render → Custom Domains → добавь, настрой CNAME/документацию Render.
- Обнови `APP_URL` + Sanctum stateful domains если нужно.

**Web Push уведомления**:
VAPID ключи уже в env. На Render https + правильный Origin — push должен работать (нужен service worker, уже есть).

**Планировщик (reminders)**:
Работает в фоне внутри того же контейнера (цикл `schedule:run` каждые 60 сек). Для очень высокой нагрузки вынеси в отдельный Background Worker позже.

**Очереди**:
Сейчас `QUEUE_CONNECTION=sync` (задачи выполняются синхронно). Если начнёшь использовать database/redis queue — добавь в supervisord или отдельный процесс `php artisan queue:work`.

**Логи**:
Всё идёт в stdout → видно в Render Logs.

## Известные ограничения текущего Dockerfile

Текущий setup использует `php artisan serve` (встроенный сервер PHP). Он простой и работает, но:

- Не самый производительный (для Petopia на семью/несколько пользователей — нормально).
- Для серьёзного продакшена позже можно переписать на nginx + php-fpm + supervisor (файлы `docker/nginx.conf` и `docker/supervisord.conf` уже лежат в репо — можно доработать).

## Troubleshooting

- **404 на /pets после хард-рефреша** — не должно быть, т.к. web.php имеет catch-all + `try_files` не нужен (SPA).
- **Uploads не сохраняются** — не подключил Disk или неправильный mountPath.
- **БД connection error** — проверь DATABASE_URL / DB_* + что Render пробросил переменные.
- **Scheduler не работает** (напоминания не приходят) — смотри логи контейнера, строка "Starting background scheduler".
- **Vite build использует localhost** — мы это починили через дефолт `/api` + .env.production.
- **Пуш-уведомления не работают** — убедись что APP_URL=https, manifest загружается, и пользователь подписался в браузере.

## Полезные команды (локально для проверки)

```bash
# Сборка как на Render
docker build -t petopia .

# Запуск (эмуляция)
docker run --rm -p 8000:8000 \
  -e PORT=8000 \
  -e APP_ENV=production \
  -e APP_KEY=base64:xxx \
  -e DATABASE_URL=sqlite:////var/www/html/database/database.sqlite \
  petopia
```

Удачи с деплоем! Если будут ошибки в логах Render — кидай сюда.

После деплоя можешь удалить/закомментировать чувствительные данные из .env.production (MAIL_PASSWORD и т.д.) и хранить их только в Render.
