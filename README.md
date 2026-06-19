# inzhenerim.ru — Billing System

> IT-биллинг и сервис-деск для IT-аутсорсинга. Личный кабинет клиента, тикеты, счета, рекламный кабинет, канбан для сотрудников, корпоративная почта и веб-почта — всё в одном Docker-стеке.

---

## Содержание

1. [Стек](#стек)
2. [Архитектура](#архитектура)
3. [Роли пользователей](#роли-пользователей)
4. [Требования к серверу](#требования-к-серверу)
5. [Быстрый старт](#быстрый-старт)
   - [1. Клонировать репозиторий](#1-клонировать-репозиторий)
   - [2. Настроить переменные окружения](#2-настроить-переменные-окружения)
   - [3. Настроить DNS](#3-настроить-dns)
   - [4. Запустить стек](#4-запустить-стек)
   - [5. Создать почтовый ящик noreply@](#5-создать-почтовый-ящик-noreply)
   - [6. Создать базу данных для Roundcube](#6-создать-базу-данных-для-roundcube)
   - [7. Проверить работу](#7-проверить-работу)
6. [Переменные окружения (.env)](#переменные-окружения-env)
7. [API — эндпоинты](#api--эндпоинты)
8. [Email-уведомления](#email-уведомления)
9. [Управление почтой (docker-mailserver)](#управление-почтой-docker-mailserver)
10. [Prisma — управление схемой БД](#prisma--управление-схемой-бд)
11. [Структура проекта](#структура-проекта)
12. [Обновление](#обновление)
13. [Решение типовых проблем](#решение-типовых-проблем)

---

## Стек

| Компонент | Технология |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend API | Node.js + Express + Prisma ORM |
| База данных | PostgreSQL 16 |
| Кэш / очереди | Redis 7 |
| Почтовый сервер | docker-mailserver (Postfix + Dovecot + Rspamd) |
| Веб-почта | Roundcube |
| Reverse proxy + SSL | Traefik v3 (автоматический Let's Encrypt) |
| Контейнеризация | Docker Engine 24+ / Docker Compose v2 |

---

## Архитектура

```
Интернет
    │
    ▼
Traefik (80/443, автоSSL)
    ├── домен.ru          → Frontend (Nginx, SPA)
    ├── домен.ru/api/*    → Backend API (Express :3001)
    └── mail.домен.ru     → Roundcube (webmail)

Backend
    ├── PostgreSQL (данные приложения + Roundcube)
    ├── Redis (сессии, кэш)
    └── Mailserver (SMTP :587, IMAP :993)
```

Все сервисы находятся в двух Docker-сетях:
- `internal` — изолированная внутренняя сеть (БД, Redis, backend, frontend)
- `external` — внешняя сеть (Traefik, mailserver — для приёма входящей почты)

---

## Роли пользователей

| Роль | Описание | Доступ |
|---|---|---|
| `CLIENT` | Клиент компании | `/cabinet` — счета, тикеты |
| `SYSADMIN` | Системный администратор | `/staff` — очередь тикетов, канбан |
| `ADS_MANAGER` | Менеджер рекламы | `/ads` — рекламный кабинет |
| `ADMIN` | Администратор системы | `/admin` — все разделы + управление пользователями |

---

## Требования к серверу

- **ОС:** Ubuntu 22.04 LTS / Debian 12
- **CPU:** 2 vCPU
- **RAM:** 2 GB (4 GB рекомендуется при включённом ClamAV)
- **Диск:** 20 GB SSD
- **Docker Engine:** 24+
- **Docker Compose:** v2 (`docker compose`, не `docker-compose`)
- **Домен** с возможностью редактировать DNS-записи

**Открытые порты:**

| Порт | Протокол | Назначение |
|---|---|---|
| 80 | TCP | HTTP (редирект на HTTPS) |
| 443 | TCP | HTTPS (сайт + API) |
| 25 | TCP | SMTP входящая почта |
| 465 | TCP | SMTPS |
| 587 | TCP | SMTP Submission (исходящая с TLS) |
| 993 | TCP | IMAPS |
| 143 | TCP | IMAP |

---

## Быстрый старт

### 1. Клонировать репозиторий

```bash
git clone https://github.com/SkllRaIn/systembiling
cd systembiling
```

---

### 2. Настроить переменные окружения

```bash
cp .env.example .env
nano .env
```

**Обязательно изменить:**

```env
APP_DOMAIN=ваш-домен.ru
MAIL_DOMAIN=ваш-домен.ru
POSTGRES_PASSWORD=сложный_пароль_бд
JWT_SECRET=длинная_случайная_строка_64_символа
JWT_REFRESH_SECRET=другая_длинная_случайная_строка_64_символа
ADMIN_EMAIL=admin@ваш-домен.ru
ADMIN_PASSWORD=пароль_администратора
```

Генерация JWT-секретов:

```bash
openssl rand -hex 64
# Выполнить дважды — для JWT_SECRET и JWT_REFRESH_SECRET
```

---

### 3. Настроить DNS

В панели вашего DNS-провайдера добавьте записи:

```
# A-записи (обязательно)
A     ваш-домен.ru        →  IP_сервера
A     mail.ваш-домен.ru   →  IP_сервера

# MX-запись (для входящей почты)
MX    ваш-домен.ru        →  mail.ваш-домен.ru   (приоритет 10)

# SPF (защита от спуфинга)
TXT   ваш-домен.ru        →  "v=spf1 mx ~all"

# DMARC (опционально, рекомендуется)
TXT   _dmarc.ваш-домен.ru →  "v=DMARC1; p=quarantine; rua=mailto:postmaster@ваш-домен.ru"
```

> **Важно:** DNS-записи распространяются до 48 часов. Запускайте стек только после того, как A-записи начали резолвиться. Traefik не сможет получить SSL-сертификат без доступного домена.

Проверить распространение:

```bash
dig A ваш-домен.ru
dig A mail.ваш-домен.ru
```

---

### 4. Запустить стек

```bash
docker compose up -d
```

При первом запуске автоматически:
- Поднимаются все контейнеры (PostgreSQL, Redis, mailserver, Roundcube, backend, frontend, Traefik)
- Выполняется `prisma migrate deploy` — создаётся схема БД
- Выполняется `prisma db seed` — создаётся учётная запись администратора (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- Traefik получает SSL-сертификаты от Let's Encrypt

Проверить состояние контейнеров:

```bash
docker compose ps
docker compose logs -f backend   # логи API
docker compose logs -f traefik   # логи SSL/proxy
```

---

### 5. Создать почтовый ящик noreply@

Backend использует этот ящик для отправки уведомлений (подтверждение email, восстановление пароля, тикеты, счета).

```bash
# Создать ящик (пароль придумать самостоятельно)
docker exec -it inzhenerim_mail setup email add noreply@ваш-домен.ru ВАШ_ПАРОЛЬ

# Записать тот же пароль в .env
SMTP_PASS=ВАШ_ПАРОЛЬ

# Перезапустить backend, чтобы подтянул новый пароль
docker compose restart backend
```

Проверить, что ящик создан:

```bash
docker exec -it inzhenerim_mail setup email list
```

---

### 6. Создать базу данных для Roundcube

Roundcube хранит настройки интерфейса и адресные книги в отдельной БД.

```bash
docker exec -it inzhenerim_db psql -U inzhenerim -c "CREATE DATABASE roundcube;"
```

После этого перезапустить Roundcube, чтобы он применил миграции:

```bash
docker compose restart roundcube
```

---

### 7. Проверить работу

| URL | Что открывается |
|---|---|
| `https://ваш-домен.ru` | Лендинг (публичный сайт) |
| `https://ваш-домен.ru/login` | Вход в систему |
| `https://ваш-домен.ru/register` | Регистрация клиента |
| `https://ваш-домен.ru/admin` | Административная панель (только ADMIN) |
| `https://mail.ваш-домен.ru` | Roundcube (веб-почта) |

Войти в административную панель: email и пароль из `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

## Переменные окружения (.env)

Полный список с описанием:

```env
# ─── Домен ────────────────────────────────────────────────────
APP_DOMAIN=ваш-домен.ru          # Основной домен сайта
MAIL_DOMAIN=ваш-домен.ru         # Домен почтового сервера (обычно тот же)

# ─── База данных ──────────────────────────────────────────────
POSTGRES_PASSWORD=               # Пароль PostgreSQL (придумать самостоятельно)

# ─── JWT (обязательно поменять!) ─────────────────────────────
JWT_SECRET=                      # Секрет для access-токенов (openssl rand -hex 64)
JWT_REFRESH_SECRET=              # Секрет для refresh-токенов (другой!)
# JWT_EXPIRES_IN=15m             # Время жизни access-токена (по умолчанию 15м)
# JWT_REFRESH_EXPIRES_IN=30d     # Время жизни refresh-токена (по умолчанию 30д)

# ─── Первый администратор ────────────────────────────────────
ADMIN_EMAIL=admin@ваш-домен.ru   # Email администратора
ADMIN_PASSWORD=                  # Пароль администратора

# ─── SMTP (внутренний mailserver) ────────────────────────────
SMTP_PASS=                       # Пароль ящика noreply@ (см. шаг 5)
# Хост, порт и пользователь заданы в docker-compose.yml автоматически

# ─── SMTP (внешний провайдер — альтернатива) ─────────────────
# Раскомментировать в docker-compose.yml и заполнить:
# SMTP_HOST=smtp.yandex.ru
# SMTP_PORT=587
# SMTP_USER=noreply@ваш-домен.ru
# SMTP_PASS=пароль_внешнего_ящика

# ─── Telegram-бот (опционально) ──────────────────────────────
TELEGRAM_BOT_TOKEN=              # Токен бота для push-уведомлений

# ─── Платёжная система ───────────────────────────────────────
# YUKASSA_SHOP_ID=               # ID магазина ЮKassa
# YUKASSA_SECRET_KEY=            # Секретный ключ ЮKassa

# ─── Let's Encrypt ───────────────────────────────────────────
# LETSENCRYPT_PATH=/etc/letsencrypt  # Путь к существующим сертификатам (если уже есть)
```

---

## API — эндпоинты

Все эндпоинты с префиксом `/api`. Аутентификация — Bearer-токен в заголовке `Authorization`.

### Аутентификация `/api/auth`

| Метод | Путь | Описание | Доступ |
|---|---|---|---|
| POST | `/auth/register` | Регистрация (создаёт CLIENT) | Публичный |
| POST | `/auth/login` | Вход, возвращает `accessToken` + `refreshToken` | Публичный |
| POST | `/auth/refresh` | Обновление пары токенов (ротация) | Публичный |
| POST | `/auth/logout` | Инвалидация refresh-токена | Публичный |
| GET  | `/auth/me` | Данные текущего пользователя | Любой авторизованный |
| POST | `/auth/verify-email` | Подтверждение email по токену из письма | Публичный |
| POST | `/auth/resend-verify` | Повторная отправка письма подтверждения | Публичный |
| POST | `/auth/forgot-password` | Запрос ссылки для сброса пароля | Публичный |
| POST | `/auth/reset-password` | Установка нового пароля по токену | Публичный |

### Пользователи `/api/users`

| Метод | Путь | Описание | Доступ |
|---|---|---|---|
| GET    | `/users` | Список пользователей (с фильтром `?role=`, `?search=`, пагинация) | ADMIN |
| POST   | `/users` | Создать пользователя (с отправкой приветственного письма) | ADMIN |
| GET    | `/users/staff` | Список сотрудников для назначения на тикеты | SYSADMIN, ADMIN |
| GET    | `/users/:id` | Данные пользователя | Свои данные или ADMIN |
| PATCH  | `/users/:id` | Изменить данные пользователя | Свои данные или ADMIN |
| DELETE | `/users/:id` | Деактивировать пользователя | ADMIN |
| GET    | `/users/:id/detail` | Детальная карточка (счета, тикеты, подписки) | ADMIN |
| POST   | `/users/:id/reset-password` | Сброс пароля администратором | ADMIN |

### Статистика `/api/admin`

| Метод | Путь | Описание | Доступ |
|---|---|---|---|
| GET | `/admin/stats` | Дашборд: клиенты, тикеты, выручка за месяц и итого | ADMIN |

### Тикеты `/api/tickets`

| Метод | Путь | Описание | Доступ |
|---|---|---|---|
| GET    | `/tickets` | Список тикетов (клиент видит свои, сотрудник — все) | CLIENT+ |
| POST   | `/tickets` | Создать тикет | CLIENT+ |
| GET    | `/tickets/:id` | Детали тикета с комментариями | CLIENT+ |
| PATCH  | `/tickets/:id` | Обновить статус, приоритет, назначить исполнителя | SYSADMIN+ |
| POST   | `/tickets/:id/comments` | Добавить комментарий | CLIENT+ |
| POST   | `/tickets/:id/attachments` | Прикрепить файл | CLIENT+ |

### Счета `/api/invoices`

| Метод | Путь | Описание | Доступ |
|---|---|---|---|
| GET    | `/invoices` | Список счетов | CLIENT (свои), ADMIN (все) |
| POST   | `/invoices` | Создать счёт | ADMIN |
| GET    | `/invoices/:id` | Детали счёта | CLIENT (свой), ADMIN |
| PATCH  | `/invoices/:id` | Обновить статус счёта | ADMIN |

### Услуги `/api/services`

| Метод | Путь | Описание | Доступ |
|---|---|---|---|
| GET   | `/services` | Список активных услуг | Публичный |
| POST  | `/services` | Создать услугу | ADMIN |
| PATCH | `/services/:id` | Изменить услугу | ADMIN |

### Задачи (канбан) `/api/tasks`

| Метод | Путь | Описание | Доступ |
|---|---|---|---|
| GET    | `/tasks` | Все задачи канбан-доски | SYSADMIN+ |
| POST   | `/tasks` | Создать задачу | SYSADMIN+ |
| PATCH  | `/tasks/:id` | Обновить задачу / переместить в колонку | SYSADMIN+ |
| DELETE | `/tasks/:id` | Удалить задачу | ADMIN |

### Реклама `/api/ads`

| Метод | Путь | Описание | Доступ |
|---|---|---|---|
| GET   | `/ads/account` | Данные рекламного аккаунта + баланс | ADS_MANAGER+ |
| GET   | `/ads/campaigns` | Список кампаний | ADS_MANAGER+ |
| POST  | `/ads/campaigns` | Создать кампанию | ADS_MANAGER+ |
| PATCH | `/ads/campaigns/:id` | Изменить кампанию | ADS_MANAGER+ |
| POST  | `/ads/deposit` | Пополнить баланс | ADS_MANAGER+ |

### Платежи `/api/payments`

| Метод | Путь | Описание | Доступ |
|---|---|---|---|
| POST | `/payments/webhook/yukassa` | Webhook от ЮKassa (`payment.succeeded`) | Публичный (ЮKassa) |

---

## Email-уведомления

Backend отправляет HTML-письма через SMTP в следующих случаях:

| Событие | Кому | Описание |
|---|---|---|
| Регистрация | Новый пользователь | Ссылка для подтверждения email (действительна 24 ч) |
| Подтверждение email | — | Токен проверяется, аккаунт активируется |
| Создание пользователя администратором | Новый пользователь | Приветственное письмо с данными для входа |
| Восстановление пароля | Запрашивающий | Ссылка для сброса (действительна 1 ч) |
| Новый тикет | Команда + клиент | Уведомление об открытии тикета |
| Смена статуса тикета | Клиент | Обновление по его обращению |
| Новый счёт | Клиент | Уведомление о выставленном счёте |
| Оплата счёта | Клиент | Подтверждение оплаты |

> **Примечание:** Войти в систему можно только после подтверждения email. Если пользователь создан администратором через панель — письмо уже содержит подтверждённый аккаунт (шаг проверки email пропускается).

---

## Управление почтой (docker-mailserver)

```bash
# Добавить почтовый ящик
docker exec -it inzhenerim_mail setup email add user@домен.ru пароль

# Список всех ящиков
docker exec -it inzhenerim_mail setup email list

# Изменить пароль ящика
docker exec -it inzhenerim_mail setup email update user@домен.ru новый_пароль

# Удалить ящик
docker exec -it inzhenerim_mail setup email del user@домен.ru

# Сгенерировать DKIM-ключ (выполнить после запуска)
docker exec -it inzhenerim_mail setup config dkim
```

После генерации DKIM добавьте в DNS TXT-запись, которую выведет команда.

---

## Prisma — управление схемой БД

```bash
# Применить миграции (запускается автоматически при старте backend)
docker exec -it inzhenerim_api npx prisma migrate deploy

# Создать новую миграцию после изменения schema.prisma
docker exec -it inzhenerim_api npx prisma migrate dev --name название_миграции

# Добавить поля для email-верификации и сброса пароля (если обновляли auth)
docker exec -it inzhenerim_api npx prisma migrate dev --name add_email_verification

# Просмотр данных в браузере (Prisma Studio)
docker exec -it inzhenerim_api npx prisma studio
# Открыть http://localhost:5555
```

---

## Структура проекта

```
systembiling/
├── .env.example                 # Шаблон переменных окружения
├── docker-compose.yml           # Полный стек: БД, Redis, mail, Roundcube, API, SPA, Traefik
├── README.md
│
├── frontend/                    # React 18 SPA
│   ├── Dockerfile
│   ├── nginx.conf               # Nginx: SPA fallback + проксирование /api
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx              # Роутер (все маршруты)
│       ├── index.css            # Tailwind + компоненты (.btn, .card, .input)
│       ├── main.jsx
│       ├── lib/
│       │   └── api.js           # Axios-инстанс с авторизацией и refresh
│       ├── store/
│       │   └── auth.js          # Zustand: user, login, logout, register
│       └── pages/
│           ├── public/          # Публичные страницы
│           │   ├── LandingPage.jsx      # Лендинг с услугами и формой заявки
│           │   ├── LoginPage.jsx        # Вход
│           │   ├── RegisterPage.jsx     # Регистрация + индикатор пароля
│           │   ├── ForgotPasswordPage.jsx   # Запрос сброса пароля
│           │   ├── ResetPasswordPage.jsx    # Установка нового пароля
│           │   ├── VerifyEmailPage.jsx      # Подтверждение email по ссылке
│           │   └── PrivacyPage.jsx          # Политика обработки ПД (152-ФЗ)
│           ├── admin/           # Панель администратора
│           │   ├── AdminLayout.jsx
│           │   ├── AdminDashboard.jsx   # Статистика (клиенты, выручка, тикеты)
│           │   ├── AdminUsers.jsx       # Управление пользователями
│           │   ├── AdminInvoices.jsx    # Счета
│           │   └── AdminServices.jsx    # Каталог услуг
│           ├── client/          # Личный кабинет клиента
│           │   ├── ClientLayout.jsx
│           │   ├── ClientDashboard.jsx
│           │   ├── ClientInvoices.jsx
│           │   ├── ClientTickets.jsx
│           │   └── ClientTicketDetail.jsx
│           ├── sysadmin/        # Рабочее место сотрудника
│           │   ├── StaffLayout.jsx
│           │   ├── KanbanBoard.jsx      # Канбан-доска задач
│           │   ├── TicketQueue.jsx      # Очередь тикетов
│           │   └── TicketDetail.jsx
│           └── ads/             # Рекламный кабинет
│               ├── AdsLayout.jsx
│               ├── AdsDashboard.jsx
│               ├── AdsCampaigns.jsx
│               └── AdsDeposit.jsx
│
└── backend/                     # Express API
    ├── Dockerfile
    └── src/
        ├── index.js             # Точка входа, подключение роутеров
        ├── middleware/
        │   ├── auth.js          # authenticate + requireRole
        │   └── errorHandler.js  # Глобальный обработчик ошибок
        ├── routes/
        │   ├── auth.js          # /api/auth/* — авторизация, email, сброс пароля
        │   ├── users.js         # /api/users/* — пользователи + /admin-stats
        │   ├── tickets.js       # /api/tickets/*
        │   ├── tasks.js         # /api/tasks/* — канбан
        │   ├── invoices.js      # /api/invoices/*
        │   ├── services.js      # /api/services/*
        │   ├── ads.js           # /api/ads/*
        │   └── payments.js      # /api/payments/webhook/yukassa
        ├── services/
        │   └── notifications.js # Отправка HTML-писем (nodemailer)
        └── utils/
            ├── jwt.js           # signAccess / signRefresh / verify*
            ├── prisma.js        # Singleton PrismaClient
            └── seed.js          # Создание первого администратора
        └── prisma/
            └── schema.prisma    # Схема БД (User, Ticket, Invoice, Task, Campaign...)
```

---

## Обновление

```bash
cd systembiling
git pull
docker compose build --no-cache
docker compose up -d
```

Миграции БД применяются автоматически при старте backend-контейнера.

---

## Решение типовых проблем

### Traefik не получает SSL-сертификат

```bash
docker compose logs traefik | grep -i cert
```

Причины: A-запись домена ещё не распространилась, порт 80 закрыт файрволом, неверный email в `ADMIN_EMAIL`.

Проверить:

```bash
curl -I http://ваш-домен.ru
```

---

### Backend не стартует — ошибка подключения к БД

```bash
docker compose logs backend | tail -30
```

Убедиться, что PostgreSQL здоров:

```bash
docker compose ps postgres
docker exec -it inzhenerim_db pg_isready -U inzhenerim
```

---

### Письма не отправляются

1. Убедиться, что ящик `noreply@` создан (шаг 5).
2. Проверить `SMTP_PASS` в `.env`.
3. Посмотреть логи backend на ошибки SMTP:
   ```bash
   docker compose logs backend | grep -i smtp
   ```
4. Проверить логи mailserver:
   ```bash
   docker compose logs mailserver | tail -50
   ```

---

### Пользователь не может войти — «Email не подтверждён»

Подтверждение email обязательно при самостоятельной регистрации. Варианты:

```bash
# Вручную подтвердить email через psql (на время тестирования)
docker exec -it inzhenerim_db psql -U inzhenerim -c \
  "UPDATE \"User\" SET \"emailVerified\"=true WHERE email='user@example.com';"
```

Или пересоздать пользователя через панель администратора (аккаунты, созданные администратором, подтверждаются автоматически).

---

### Roundcube показывает пустой экран

Убедиться, что база данных `roundcube` создана (шаг 6):

```bash
docker exec -it inzhenerim_db psql -U inzhenerim -c "\l"
docker compose restart roundcube
docker compose logs roundcube | tail -20
```

---

### DKIM: письма попадают в спам

```bash
# Сгенерировать DKIM-ключ
docker exec -it inzhenerim_mail setup config dkim

# Вывести DNS-запись для добавления
docker exec -it inzhenerim_mail cat /tmp/docker-mailserver/opendkim/keys/ваш-домен.ru/mail.txt
```

Добавьте вывод как TXT-запись в DNS. Проверка после распространения:

```bash
dig TXT mail._domainkey.ваш-домен.ru
```

---

## Лицензия

MIT — используйте свободно, указывайте источник при публикации.
