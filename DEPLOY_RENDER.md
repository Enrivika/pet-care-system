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

## Полная инструкция: Ручное создание Web Service + Postgres (без Blueprint)

> **Blueprint** (автоматическое создание по `render.yaml`) на бесплатном/дешёвом плане часто недоступен или имеет ограничения. Поэтому здесь — **самый надёжный и детальный мануал** по созданию всего вручную.

### Шаг 0: Подготовка репозитория (обязательно!)

Перед созданием любых ресурсов на Render убедись, что последние исправления (особенно `.dockerignore`) запушены:

```powershell
git status
git add .
git commit -m "fix: .dockerignore for docker/entrypoint.sh + manual deploy prep"
git push origin main
```

### Шаг 1: Создаём Postgres (Render Managed PostgreSQL)

1. В панели Render нажми **New +** → **PostgreSQL**.
2. Настрой:
   - **Name**: `petopia-db`
   - **Database Name**: `petopia`
   - **User**: `petopia`
   - **Region**: Выбери регион (например Frankfurt или Oregon). **Запомни его** — Web Service должен быть в том же регионе.
   - **Plan**: Free
3. Нажми **Create Database**.
4. После создания открой базу данных:
   - Перейди во вкладку **Connect** или нажми **Connect** вверху.
   - Скопируй **полную Internal Connection String** (или "Database URL").
     Пример: `postgres://petopia:xxxxxxxxxx@oregon-postgres.render.com:5432/petopia`
   - Сохрани эту строку — она понадобится как `DATABASE_URL`.

   > Используй **Internal**, а не External — это правильнее и дешевле.

### Шаг 2: Создаём Web Service (Docker)

1. Нажми **New +** → **Web Service**.
2. Выбери свой GitHub-репозиторий → **Connect**.
3. Заполни форму:

   | Поле                    | Значение                              | Комментарий |
   |-------------------------|---------------------------------------|-----------|
   | Name                    | `petopia`                             | любое удобное |
   | Environment             | **Docker**                            | **Обязательно!** |
   | Region                  | Тот же, что у Postgres                | критично для скорости |
   | Branch                  | `main`                                | твоя основная ветка |
   | Root Directory          | (оставить пустым)                     | или `.` |
   | **Dockerfile Path**     | `./Dockerfile`                        | важно |
   | Plan                    | Free или Starter                      | Free может быть ограничен для Docker |

4. Нажми **Create Web Service**.

   Render сразу начнёт билд. Первый билд почти наверняка "упадёт" или будет висеть на ошибках окружения — это нормально. Мы добавим переменные дальше.

### Шаг 3: Добавляем все Environment Variables

Зайди в созданный Web Service → вкладка **Environment** (слева).

Добавляй переменные по одной или через **Bulk edit** (удобнее).

#### 3.1 Базовые переменные

```
APP_NAME=Petopia
APP_ENV=production
APP_DEBUG=false
APP_TIMEZONE=Europe/Moscow
LOG_LEVEL=error
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
CACHE_STORE=file
FILESYSTEM_DISK=local
```

#### 3.2 APP_KEY (генерируем локально!)

В своём терминале (в папке проекта) выполни:

```bash
php artisan key:generate --show
```

Скопируй значение (начинается с `base64:`) и добавь переменную:

- `APP_KEY` = `base64:скопированное_значение`

#### 3.3 APP_URL

Сначала дай сервису хотя бы один раз отдеплоиться (даже если с ошибкой). Render покажет публичный URL вида:

`https://petopia-abc123.onrender.com`

Добавь/обнови переменную:

- `APP_URL` = `https://petopia-abc123.onrender.com`   (замени на свой реальный)

#### 3.4 База данных (самый важный блок)

**Рекомендуемый способ** — одной строкой:

- `DATABASE_URL` = `postgres://petopia:пароль@...`   ← вставь сюда **полную строку**, которую скопировал из Postgres

Альтернатива (отдельные поля):

- `DB_CONNECTION=pgsql`
- `DB_HOST=...` (из строки подключения)
- `DB_PORT=5432`
- `DB_DATABASE=petopia`
- `DB_USERNAME=petopia`
- `DB_PASSWORD=...` (пароль)

#### 3.5 Почта (Gmail) — обязательно делай MAIL_PASSWORD секретом

- `MAIL_MAILER=smtp`
- `MAIL_HOST=smtp.gmail.com`
- `MAIL_PORT=587`
- `MAIL_USERNAME=vika.ponomareva.200402@gmail.com`
- `MAIL_PASSWORD=твой_gmail_app_password`   ← при создании нажми на иконку **секрет** (замок/глаз)
- `MAIL_ENCRYPTION=tls`
- `MAIL_FROM_ADDRESS=vika.ponomareva.200402@gmail.com`
- `MAIL_FROM_NAME=Petopia`

#### 3.6 Web Push уведомления (VAPID)

Скопируй из своего `.env.production`:

- `VAPID_PUBLIC_KEY=BHPxLisHrbOrX3HDurySLJ7LofgsVMkLyOo4v_FYNHXrtA_RMvbwhUaGyIsRnH0xNQTCtIMDIK6udtFYTsvWbGs`
- `VAPID_PRIVATE_KEY=IxX3g8PaRHkfYFFCzGJ68y7egP_TrfIrF8QuF8LWicU`

#### 3.7 (Опционально)

- `VITE_API_URL=/api`

После добавления всех переменных нажми **Save Changes**.

### Шаг 4: Подключаем Persistent Disk (для фото питомцев и аватаров)

**Без этого все загруженные изображения будут теряться при каждом редеплое!**

1. В Web Service зайди в меню слева → **Disks**.
2. Нажми **Add Disk**.
3. Заполни точно:
   - **Name**: `petopia-uploads`
   - **Mount Path**: `/var/www/html/persistent`   ← **точно так, без ошибок**
   - **Size**: 1 GB (достаточно для начала)
4. Create Disk.

Наш `docker/entrypoint.sh` автоматически создаст нужные папки и симлинки при старте контейнера.

### Шаг 5: Дополнительные настройки сервиса

Зайди в **Settings** (слева):

- **Health Check Path**: `/up`   (Laravel предоставляет этот эндпоинт)
- **Auto Deploy**: включено
- **Pull Request Previews**: можно выключить

Сохрани.

### Шаг 6: Запускаем билд / деплой

1. В верхней части страницы Web Service нажми **Manual Deploy** → **Deploy latest commit**.
2. (Рекомендуется) Перед этим можно нажать **Clear build cache**, чтобы сборка точно пошла с чистого листа.
3. Переключись на вкладку **Logs**.
4. Следи за двумя этапами:
   - **Build** — Docker собирает образ (node stage + php stage)
   - **Runtime** (после успешной сборки) — должен появиться вывод из entrypoint:

     ```
     ==> Petopia entrypoint starting (Render.com compatible)...
     ==> Preparing persistent upload directories (disk recommended)...
     ==> Running migrations...
     ==> Starting background scheduler in background...
     ==> Starting PHP built-in server on 0.0.0.0:XXXX
     ```

Если миграции прошли — база готова.

### Шаг 7: Финальная проверка

- Открой публичный URL сервиса.
- Зарегистрируй нового пользователя.
- Создай питомца и загрузи фото.
- Сделай несколько событий в календаре.
- Подожди минуту-две и проверь, что шедулер работает (напоминания создаются).
- Передеплой сервис (Manual Deploy) и убедись, что загруженные фото остались (диск работает).

---

## Что делать, если что-то пошло не так

Смотри логи Runtime. Самые частые проблемы и решения описаны в конце этого файла (раздел Troubleshooting).

---

## (Информация про Blueprint — можно пропустить)

`render.yaml` в репозитории остался. Если в будущем Render снимет ограничения на Blueprint, ты сможешь использовать его для более быстрого разворачивания. Пока используем ручной способ выше.

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

## Известные миграции с MySQL-специфичным кодом

В проекте была одна миграция, которая использовала raw SQL только для MySQL (`MODIFY` + backticks). 
При деплое на Postgres она падала.

Мы её исправили (используем `Schema::table(...)->change()` + doctrine/dbal). 
При следующем `composer install` зависимость подтянется автоматически.

Если у тебя уже есть частично применённые миграции на боевой БД Render — после фикса просто передеплой. Миграция должна доотработать.
