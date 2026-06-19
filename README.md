 — Billing System — 

## Стек

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Prisma (PostgreSQL)
- **Mail server**: docker-mailserver (Postfix + Dovecot)
- **Webmail**: Roundcube
- **Proxy + SSL**: Traefik v3 (автоматический Let's Encrypt)
- **Cache**: Redis

---

## Быстрый старт (Docker)

### 1. Требования

- Ubuntu 22.04+ / Debian 12
- Docker Engine 24+ и Docker Compose v2
- Домен с настроенными A-записями:
  - `домен.ru` → IP сервера
  - `mail.домен.ru` → IP сервера
- Открытые порты: 80, 443, 25, 465, 587, 993, 143

### 2. Клонировать репозиторий

```bash
git clone https://github.com/SkllRaIn/systembiling
cd systembiling
```

### 3. Настроить переменные окruжения

```bash
cp .env.example .env
nano .env
```

Обязательно поменять:
- `POSTGRES_PASSWORD` — пароль БД
- `JWT_SECRET` и `JWT_REFRESH_SECRET` — длинные случайные строки
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — первый администратор
- `APP_DOMAIN` / `MAIL_DOMAIN` — ваш домен

Генерация JWT secrets:
```bash
openssl rand -hex 64
```

### 4. Настроить DNS MX-запись

В панели вашего регистратора домена добавьте:
```
MX  доменю.ru  mail.домен.ru  10
TXT домен.ru  "v=spf1 mx ~all"
```

### 5. Запустить

```bash
docker compose up -d
```

При первом запуске автоматически:
- Создаётся БД и применяется схема Prisma
- Создаётся учётная запись администратора (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)

### 6. Создать почтовый ящик для отправки уведомлений

```bash
# Зайти в контейнер mail-сервера
docker exec -it домен_mail setup email add noreply@домен.ru YOUR_SMTP_PASS

# Указать тот же пароль в .env → SMTP_PASS, затем перезапустить backend:
docker compose restart backend
```

### 7. Создать базу данных для Roundcube

```bash
docker exec -it домен_db psql -U домен -c "CREATE DATABASE roundcube;"
```

### 8. Готово!

- Сайт: `https://домен.ru`
- Webmail (Roundcube): `https://mail.домен.ru`
- Войти в админку: `/login` → `/admin`

---

## Стruктура проекта

```
systembiling/
├── frontend/               # React SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/      # Административная панель
│   │   │   │   ├── AdminDashboard.jsx  ← НОВЫЙ дашборд
│   │   │   │   ├── AdminUsers.jsx      ← УЛУЧШЕН
│   │   │   │   ├── AdminInvoices.jsx
│   │   │   │   ├── AdminServices.jsx
│   │   │   │   └── AdminLayout.jsx     ← ОБНОВЛЁН
│   │   │   ├── client/     # Личный кабинет клиента
│   │   │   ├── sysadmin/   # Канбан + тикеты
│   │   │   ├── ads/        # Рекламный кабинет
│   │   │   └── public/     # Landing, Login, Register
│   │   └── App.jsx         ← ОБНОВЛЁН (добавлен /admin → dashboard)
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                # Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── users.js    ← УЛУЧШЕН (создание, сброс пароля, детали, поиск, статистика)
│   │   │   ├── auth.js
│   │   │   ├── invoices.js
│   │   │   ├── tickets.js
│   │   │   ├── tasks.js
│   │   │   ├── services.js
│   │   │   ├── ads.js
│   │   │   └── payments.js
│   │   ├── services/
│   │   │   └── notifications.js  ← УЛУЧШЕН (HTML-письма, уведомление при создании юзера)
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── index.js        ← ОБНОВЛЁН (алиас /api/admin/stats)
│   ├── prisma/
│   │   └── schema.prisma
│   └── Dockerfile
│
├── docker-compose.yml       ← НОВЫЙ
├── .env.example             ← НОВЫЙ
└── README.md
```

---

## Что добавлено в этом PR

### Административная панель

| Функция | Описание |
|---|---|
| **Дашборд** | Статистика: клиенты, сотruдники, счета к оплате, тикеты, выruчка за месяц и всего |
| **Создание пользователей** | Форма с именем, email, паролем, телефоном и ролью |
| **Страница пользователя** | Slide-in панель со счетами, тикетами и подписками |
| **Сброс пароля** | Установить новый пароль + инвалидация всех refresh-токенов |
| **Поиск** | Поиск по имени и email |
| **Приветственное письмо** | При создании пользователя админом отправляется email с данными для входа |

### Email уведомления

| Событие | Кому |
|---|---|
| Создание пользователя | Новому пользователю (данные для входа) |
| Создание тикета | Команде + клиенту (подтверждение) |
| Обновление статуса тикета | Клиенту |
| Новый счёт | Клиенту |
| Оплата счёта | Клиенту |

### Инфрастruктура

- `docker-compose.yml` с полным стеком (PostgreSQL, Redis, Backend, Frontend, Traefik, Mailserver, Roundcube)
- Автоматический SSL через Let's Encrypt (Traefik)
- Nginx как reverse proxy для SPA + API

---

## API — новые эндпоинты

```
GET    /api/admin/stats              — статистика дашборда (ADMIN)
POST   /api/users                    — создать пользователя (ADMIN)
GET    /api/users/:id/detail         — детали пользователя (ADMIN)
POST   /api/users/:id/reset-password — сброс пароля (ADMIN)
GET    /api/users?search=xxx         — поиск пользователей (ADMIN)
```

---

## Управление почтой (docker-mailserver)

```bash
# Добавить ящик
docker exec -it домен_mail setup email add user@домен.ru password

# Список ящиков
docker exec -it домен_mail setup email list

# Изменить пароль
docker exec -it домен_mail setup email update user@домен.ru newpassword

# Удалить ящик
docker exec -it домен_mail setup email del user@домен.ru

# DKIM (добавить в DNS после генерации)
docker exec -it домен_mail setup config dkim
```

---

## Обновление

```bash
git pull
docker compose build --no-cache
docker compose up -d
```
