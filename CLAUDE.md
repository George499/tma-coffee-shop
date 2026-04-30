# TMA Coffee Shop — контекст для Claude Code

Это файл-инструкция. Читай его перед каждой задачей в этом проекте.

## Что мы делаем

Telegram Mini App "Кофейня" — каталог + корзина с отправкой заказа в Telegram-чат админа. Это **портфолио-проект**, не реальный продукт. Цель — показать заказчикам на фрилансе работу с TMA SDK, NestJS-бэком, Prisma, деплоем.

## Стек (фиксированный, не предлагать альтернативы без запроса)

- **Монорепо**: pnpm workspaces
- **Web**: Next.js 16 (App Router, React 19) + TypeScript + Tailwind v4 + `@telegram-apps/sdk-react` + TanStack Query + Zustand + react-hook-form + zod
- **API**: NestJS + Prisma + Postgres + class-validator
- **Bot**: grammy, **в одном процессе с API** (Telegram webhook на `/api/telegram/webhook` в проде, long-poll внутри API в локальном dev по `TELEGRAM_LONGPOLL=true`)
- **Деплой**: Vercel (web) + Koyeb (api в одном Dockerfile, free `eco/nano`) + Neon (db)
- **DB**: Postgres (Neon serverless, free tier)

## Структура

```
tma-coffee-shop/
├── apps/
│   ├── web/                # Next.js TMA, vercel.json для деплоя
│   └── api/                # NestJS REST + Telegram webhook (бот живёт здесь)
│       └── Dockerfile      # многостадийный билд для Koyeb (build context = repo root)
├── packages/
│   └── shared/             # типы, OrderStatus/DeliveryType enum
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env.example
└── README.md
```

Бывшая папка `apps/bot` удалена в (Deploy)-итерации: callback-handler grammy переехал в `apps/api/src/telegram/`. Любые будущие изменения логики бота — только там.

## Модель данных (Prisma)

- `Category`: id, name, slug, sortOrder, createdAt
- `Product`: id, categoryId, name, description, price (Int, копейки), imageUrl, isAvailable, createdAt
- `User`: id (BigInt — Telegram ID), firstName, lastName?, username?, languageCode?, createdAt
- `Order`: id (cuid), userId, status (NEW/ACCEPTED/READY/COMPLETED/CANCELLED), totalAmount, deliveryType (PICKUP/DELIVERY), address?, customerName, customerPhone, scheduledAt?, comment?, createdAt
- `OrderItem`: id, orderId, productId, productName (snapshot), productPrice (snapshot), quantity

Цены — в копейках (Int), форматирование на фронте.
Snapshot названий и цен в OrderItem — обязательно (товар может измениться, заказ должен помнить как было).

## Принципы кода

### Общее
- TypeScript строгий (`strict: true`).
- Никаких `any`, кроме совсем крайних случаев с TODO-комментарием.
- Импорты абсолютные через alias (`@/`), не `../../../`.
- Файлы по фиче, не по слою (нестовский стиль): `orders/orders.controller.ts`, `orders/orders.service.ts`, `orders/dto/`.

### Фронт (Next.js)
- App Router, клиентские компоненты для интерактива (`'use client'`).
- TanStack Query для серверного состояния, Zustand для клиентского (корзина).
- Никакого Redux.
- Стили только Tailwind, никаких CSS-модулей и styled-components.
- Telegram-тема через CSS-переменные, прокинутые в Tailwind config.
- Все переменные ENV для фронта — с префиксом `NEXT_PUBLIC_`.

### Бэк (NestJS)
- Prisma напрямую в сервисах, без репозиторного слоя (это упрощение для портфолио).
- DTO с class-validator, глобальный ValidationPipe с `whitelist: true, forbidNonWhitelisted: true`.
- Guards для защиты эндпоинтов (TmaAuthGuard).
- Не доверяй клиенту: сумму заказа считай на сервере по актуальным ценам в БД.
- ENV через `@nestjs/config`, типизированный config-сервис.

### Бот (grammy внутри API)
- Бот живёт в `apps/api/src/telegram/`, отдельного процесса нет.
- В проде Telegram POSTит updates на `/api/telegram/webhook`, контроллер форвардит в `bot.handleUpdate()`. Защита — `X-Telegram-Bot-Api-Secret-Token` (Telegram кладёт его на каждом обращении, мы сверяем с `TELEGRAM_WEBHOOK_SECRET`).
- В локальном dev — long-poll внутри API при `TELEGRAM_LONGPOLL=true`.
- Inline-кнопки "Принять/Отклонить" вызывают `OrdersService.applyAction(...)` напрямую, без HTTP-перепрыга. PATCH `/api/orders/:id/status` с `BotAuthGuard` оставлен как точка интеграции для внешних админ-инструментов.
- Никакой сложной FSM.

## Безопасность (это критично)

1. **Валидация initData** — обязательна на каждом защищённом эндпоинте. Проверка подписи через HMAC-SHA256 от bot token, проверка `auth_date` (не старше 24 часов).
2. **Никогда не доверяй цене с клиента** — пересчитывай на сервере.
3. **Bot token** — только в ENV, никогда в коде, никогда на фронте.
4. **CORS** — ограничить только origin'ом фронта.

## ENV переменные (минимум)

```
# Postgres
DATABASE_URL=postgresql://...

# Telegram bot
TELEGRAM_BOT_TOKEN=
ADMIN_CHAT_ID=

# Web (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BOT_USERNAME=

# API
PORT=3001
WEB_ORIGIN=http://localhost:3000

# PATCH /api/orders/:id/status (server-to-server, dormant пока в прод нет внешних админ-тулов)
BOT_API_SECRET=

# Telegram webhook (продакшен). Локально не задаём; для long-poll ставим TELEGRAM_LONGPOLL=true.
# TELEGRAM_WEBHOOK_URL=https://your-api.onrender.com/api/telegram/webhook
# TELEGRAM_WEBHOOK_SECRET=
# TELEGRAM_LONGPOLL=true
```

## Чего НЕ делаем (anti-scope)

- Реальная оплата (ни Telegram Stars, ни эквайринг)
- Админ-панель в вебе (управление через бот достаточно)
- Push о статусе клиенту (только админ)
- Промокоды, отзывы, избранное, многоязычность
- Переусложнённая архитектура (CQRS, event sourcing, hexagonal — это портфолио, не банк)
- Тесты на всё подряд — только на критичное (валидация initData, расчёт total)
- Storybook, monorepo-инструменты типа Nx/Turborepo (pnpm workspaces достаточно)

## Стиль коммитов

Conventional Commits, осмысленные сообщения:
- `feat(web): add product card component`
- `feat(api): implement initData validation`
- `fix(bot): handle missing chat id`
- `chore: update prisma schema for snapshots`
- `docs: add deployment instructions`

**Нет коммитам**: "fix", "wip", "update", "asdf".

Коммиты — атомарные (одна логическая единица = один коммит).

## Когда сомневаешься

Если задача неоднозначная или появилась развилка (например, "может лучше использовать Y вместо X") — **спроси у пользователя**, не выбирай в одну сторону молча. Пользователь параллельно консультируется с другим Claude по архитектуре, ему важно знать о развилках.

Если задача требует доступа к внешним сервисам (Railway, Vercel, Telegram BotFather) — **дай инструкцию пользователю**, ты сам туда не ходишь.

## Что не упоминаем в коде и README

В README, комментариях, коммитах **не упоминать AI-инструменты** (Claude, Cursor, Copilot и т.д.). Это правило заказчика — портфолио должно выглядеть как обычная разработка.

---

## Текущее состояние (на момент последнего коммита)

Все 5 пунктов исходного roadmap (C-orders, B-cart, B-checkout, Bot-notify, Deploy) реализованы и **развёрнуты в продакшене**. Боевой URL API — `https://tma-api.inglo.ru`, фронт — `https://tma-coffee-shop.vercel.app`, бот — `@tma_coffee_shop_bot`.

Текущее состояние кода:

- **API** (NestJS 11): `GET /api/categories`, `GET /api/products?categoryId=N` — публичные. `GET /api/me`, `POST /api/orders`, `GET /api/orders/:id` — `TmaAuthGuard`. `PATCH /api/orders/:id/status` — `BotAuthGuard` (X-Bot-Secret). `POST /api/telegram/webhook` — Telegram secret-token. `/api` префикс, CORS на `WEB_ORIGIN`, ValidationPipe whitelist+forbid+transform.
- **OrdersService**: создаёт заказ в `prisma.$transaction`, считает total на сервере, snapshot'ит productName/productPrice в OrderItem, upsert'ит User по Telegram-id. Best-effort шлёт уведомление в админ-чат через `AdminNotifierService` (отдельный fetch, не падает при недоступности Telegram). `applyAction()` переводит NEW→ACCEPTED/CANCELLED conditionally; повторный вызов даёт 409.
- **Telegram** (`apps/api/src/telegram/`): grammy Bot инстанс с callback handler на `/^order:(accept|reject):(.+)$/`. Webhook controller валидирует `X-Telegram-Bot-Api-Secret-Token`. На bootstrap делает `bot.init()` (нужно для webhook-режима, иначе `handleUpdate` падает с "Bot not initialized!"), потом либо `setWebhook(TELEGRAM_WEBHOOK_URL)`, либо long-poll если `TELEGRAM_LONGPOLL=true`. Mode переключается в `webhook` **до** успеха `setWebhook` — транзиентная ошибка регистрации не должна выключать inbound-обработчик.
- **Web** (Next.js 16): `/` каталог с категориями, `ProductCard` со степпером "+/N/-", фиксированный `CartBar` "В корзине X · ₽". Zustand store с `localStorage` persist. `/checkout` — react-hook-form + zod (PICKUP/DELIVERY conditional address, phone regex, scheduledAt диапазон now+15min..now+14d). `/order/[id]` — TanStack Query с adaptive polling (3с при NEW, 5с при ACCEPTED, off при terminal) и Page Visibility-паузой.
- **Тесты**: 11/11 (5 init-data + 6 calculateTotal).
- **Деплой:**
  - **Web**: Vercel (`apps/web/vercel.json`), env `NEXT_PUBLIC_API_URL=https://tma-api.inglo.ru`.
  - **API**: self-hosted **Coolify v4** на VPS Hostland (Ubuntu 24.04, 11 GB / 4 vCPU). Coolify деплоит из GitHub `main` через `apps/api/Dockerfile` (build context = repo root). Контейнер слушает на 3001, Coolify Traefik забинден на `127.0.0.1:8080:80` (наружу не торчит). Существующий nginx на VPS принимает HTTPS на `tma-api.inglo.ru`, делает SSL termination через certbot HTTP-challenge (auto-renew стандартным cron'ом), и проксирует на `127.0.0.1:8080` → Traefik → контейнер. Конфиг nginx: `/etc/nginx/sites-available/tma-api.inglo.ru.conf`.
  - **DB**: Neon (продолжаем). Direct connection (без `-pooler`), pooling делает `@prisma/adapter-neon` через WebSocket-driver.
  - **Telegram-прокси**: Hostland-датацентр блокирует и outbound к `api.telegram.org`, и inbound с IP Telegram. Решено двунаправленным Cloudflare Worker'ом `tg-proxy.vypyrov.workers.dev`. Outbound: `bot.api.*` ходит через `TELEGRAM_API_ROOT=https://tg-proxy.vypyrov.workers.dev` (передаётся в grammy и в `AdminNotifierService.notifyNewOrder`). Inbound: webhook зарегистрирован на `https://tg-proxy.vypyrov.workers.dev/inbound/api/telegram/webhook`, Worker форвардит этот path на `https://tma-api.inglo.ru/api/telegram/webhook`. Код Worker'а лежит в README → раздел "Note for Russian VPS hosts".
- **Sudo на VPS**: рабочий пользователь `deploy` имеет `sudo` (с паролем). Никаких passwordless-прав на сервере не оставлено.

Что **не делаем** на этом этапе: переходы `ACCEPTED→READY→COMPLETED` (если потребуются — расширить `applyAction` + добавить кнопки в notifier message).

## Setup на новой машине

Этот файл первый, что читает Claude Code в любой сессии в этой директории. Если ты только что клонировал репо — следуй этим шагам.

```bash
git clone https://github.com/George499/tma-coffee-shop.git
cd tma-coffee-shop
pnpm install
cp .env.example .env
```

`.env.example` сейчас содержит **рабочие тестовые значения** (Neon DSN, Telegram bot token, ADMIN_CHAT_ID — всё специально committed для лёгкого handoff демо-портфолио). Скопировал — и всё, можно работать. Перед production-развёртыванием эти значения **обязательно** заменить и убрать `.env.example` из репо.

Если GitHub secret scanning отозвал bot token (Telegram кооперируется со сканером и иногда инвалидирует залитые токены) — `/revoke` у `@BotFather`, новое значение в `.env.example`, push.

Прогнать миграцию и seed:

```bash
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate    # если миграция уже применена в Neon — будет no-op
pnpm prisma:seed       # idempotent
cd ../..
```

Запуск всех приложений в dev (`pnpm dev` с корня для параллельного запуска или вручную):

```bash
pnpm --filter @tma-coffee-shop/api dev      # → http://localhost:3001 (включая Telegram long-poll, если TELEGRAM_LONGPOLL=true)
pnpm --filter @tma-coffee-shop/web dev      # → http://localhost:3000
```

Тест initData валидации:

```bash
cd apps/api && npx jest --testPathPatterns=init-data
```

## Известные особенности окружения

- **Кириллица в пути проекта ломает Turbopack** (Next.js 16). Держи проект в пути типа `C:\dev\tma-coffee-shop`, **не** в `OneDrive\Документы\...` — будет панике с UTF-8 byte boundaries при `next build`.
- **Picsum.photos** на некоторых сетях резолвится в IP из CGN-range (`198.18.0.0/15`). Next image optimiser отказывается ходить по private IP. Поэтому в `<ProductCard />` стоит `unoptimized` на `<Image>`. Когда заменишь placeholder-картинки на реальный CDN — флаг можно убрать.
- **pnpm 10** не запускает `postinstall` скрипты по умолчанию. Список разрешённых пакетов — в `pnpm-workspace.yaml` → `onlyBuiltDependencies`. Если понадобится новый пакет с native-deps — добавить туда.
- **Prisma 7** убрала `url` из `datasource db` в schema. Конфиг — в `apps/api/prisma.config.ts`. Driver adapter (`@prisma/adapter-neon`) подключается в `PrismaService` constructor.
- **`.env` грузится в API из main.ts** через `dotenv` с явным path `process.cwd() + '../../.env'` **до** импорта `@nestjs/*`. Это критично: `PrismaService` читает `DATABASE_URL` в constructor, и без явной ранней загрузки получит `undefined`. Не переноси `loadEnv()` ниже импортов. В проде на Koyeb `.env` файла нет — `dotenv` no-op, переменные приходят из Koyeb env.
- **Кросс-платформенно** скрипты используют `node --env-file=../../.env` (Node 20+ нативный флаг). Если nest watch висит и не может занять порт — остался zombie от предыдущего запуска: `netstat -ano | grep ":3001"` → `taskkill //F //PID <pid>`.
- **Telegram webhook ↔ long-poll взаимоисключающие**. Telegram держит ровно один источник updates на бот. На локалке с `TELEGRAM_LONGPOLL=true` сервис при старте делает `deleteWebhook()` — иначе grammy выкинет 409 от Bot API.
- **Koyeb free `eco/nano`** не засыпает по простою, но имеет лимиты по CPU/bandwidth и периодически рестартует. Если стартап-запросы начнут таймаутить — поднять инстанс на оплачиваемый или вернуться к Render/Railway. UptimeRobot keepalive не нужен.
