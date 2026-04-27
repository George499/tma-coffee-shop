# TMA Coffee Shop — контекст для Claude Code

Это файл-инструкция. Читай его перед каждой задачей в этом проекте.

## Что мы делаем

Telegram Mini App "Кофейня" — каталог + корзина с отправкой заказа в Telegram-чат админа. Это **портфолио-проект**, не реальный продукт. Цель — показать заказчикам на фрилансе работу с TMA SDK, NestJS-бэком, Prisma, деплоем.

## Стек (фиксированный, не предлагать альтернативы без запроса)

- **Монорепо**: pnpm workspaces
- **Web**: Next.js 16 (App Router, React 19) + TypeScript + Tailwind v4 + `@telegram-apps/sdk-react` + TanStack Query + Zustand + react-hook-form + zod
- **API**: NestJS + Prisma + Postgres + class-validator
- **Bot**: grammy
- **Деплой**: Vercel (web) + Neon (db); api и bot — TBD (free-tier на Render/Fly.io)
- **DB**: Postgres (Neon serverless, free tier)

## Структура

```
tma-coffee-shop/
├── apps/
│   ├── web/          # Next.js TMA
│   ├── api/          # NestJS REST
│   └── bot/          # grammy bot
├── packages/
│   └── shared/       # типы, zod-схемы
├── docker-compose.yml
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env.example
└── README.md
```

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

### Бот (grammy)
- Бот лёгкий: его задача — запустить WebApp и принимать уведомления о заказах.
- Inline-кнопки на сообщениях о заказах (Принять / Отклонить) → меняют статус через API.
- Никакой сложной FSM.

## Безопасность (это критично)

1. **Валидация initData** — обязательна на каждом защищённом эндпоинте. Проверка подписи через HMAC-SHA256 от bot token, проверка `auth_date` (не старше 24 часов).
2. **Никогда не доверяй цене с клиента** — пересчитывай на сервере.
3. **Bot token** — только в ENV, никогда в коде, никогда на фронте.
4. **CORS** — ограничить только origin'ом фронта.

## ENV переменные (минимум)

```
# Postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/coffee_shop

# Telegram
TELEGRAM_BOT_TOKEN=
ADMIN_CHAT_ID=

# Web
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BOT_USERNAME=

# API
PORT=3001
WEB_ORIGIN=http://localhost:3000
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

Каркас и базовая безопасность готовы. На уровне коммитов это видно как `feat(...)` цепочка: bootstrap → web → api → bot → shared → Prisma → catalog → web-каталог → TmaAuthGuard.

Что **сделано и проверено**:

- pnpm workspace монорепо: `apps/web`, `apps/api`, `apps/bot`, `packages/shared`. Все воркспейсы проходят `pnpm typecheck` и `pnpm build`.
- **Neon Postgres** (serverless) подключён через **Prisma 7 + @prisma/adapter-neon**. Миграция `init` применена. Seed (3 категории, 9 продуктов с placeholder-картинками с picsum) работает через `pnpm --filter @tma-coffee-shop/api prisma:seed`.
- **API** (NestJS 11): `GET /api/categories`, `GET /api/products?categoryId=N` — публичные. `GET /api/me` — защищённый `TmaAuthGuard`. Глобальный `ValidationPipe` со `whitelist + forbidNonWhitelisted + transform`. CORS на `WEB_ORIGIN`. `/api` префикс на всё.
- **TmaAuthGuard** + `validateInitData` (HMAC-SHA256 через `@telegram-apps/init-data-node`, окно 24 часа). Юнит-тест из 5 кейсов: валидная подпись, чужой токен, expired, пустая строка, tampered. Прогоняется через `npx jest --testPathPatterns=init-data`.
- **Bot** (grammy): минимальный, отвечает на `/start`. `pnpm --filter @tma-coffee-shop/bot dev`.
- **Web** (Next.js 16 App Router + Tailwind v4): `/` показывает каталог. Грид 2/3/4 колонки. Цены через `Intl.NumberFormat` в RUB. Telegram theme через CSS-переменные `--tg-theme-*` с fallback под обычный браузер. **TanStack Query** для серверного состояния. **TelegramInit** компонент монтирует SDK когда страница открыта в Telegram, в обычном браузере молча no-op.
- На фронте есть **`tmaFetch` обёртка** в `apps/web/lib/api.ts` — для будущих защищённых запросов.
- `@tma-coffee-shop/shared` экспортирует `OrderStatus` и `DeliveryType` enums. Web/API пока **их не используют** — будет нужно в (C-orders).

Что **НЕ сделано** (см. roadmap ниже).

## Дорожная карта (приоритет сверху вниз)

1. **(C-orders) `POST /api/orders`** — корзина → заказ.
   - DTO с class-validator (`items: { productId, quantity }[]`, `deliveryType`, `address?`, `customerName`, `customerPhone`, `scheduledAt?`, `comment?`).
   - Защищён `TmaAuthGuard`.
   - Upsert `User` по Telegram-id из `req.tmaUser`.
   - **Пересчёт `totalAmount` на сервере** по актуальным `Product.price` из БД (CLAUDE.md: "не доверяй цене с клиента"). Снапшот `productName` и `productPrice` в `OrderItem`.
   - Тест на расчёт total (CLAUDE.md прямо требует: "только на критичное — валидация initData, расчёт total").
2. **(B-cart) Корзина на фронте** — `Zustand` store, кнопка "+" на `ProductCard`, нижняя зафиксированная панель "В корзине X · YYYY ₽" → переход на `/checkout`.
3. **(B-checkout) `/checkout`** — `react-hook-form` + `zod` (имя, телефон, `PICKUP`/`DELIVERY` + адрес если delivery, желаемое время, комментарий) → `api.createOrder()` через `tmaFetch`.
4. **(Bot-notify)** — после успеха `POST /api/orders` API дёргает Bot API `sendMessage` в `ADMIN_CHAT_ID` с inline-кнопками "Принять/Отклонить". Кнопки хитят защищённый эндпоинт смены статуса (с auth не initData, а `X-Bot-Secret`, отдельный механизм для server-to-server). Этот механизм — отдельная развилка к моменту реализации.
5. **(Deploy)** — Vercel (web) + Render free tier или Fly.io free (api+bot). Установить Web App URL в BotFather. Реальный e2e-тест из Telegram.

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

Запуск всех приложений в dev (в трёх терминалах или `pnpm dev` с корня для параллельного запуска):

```bash
pnpm --filter @tma-coffee-shop/api dev      # → http://localhost:3001
pnpm --filter @tma-coffee-shop/web dev      # → http://localhost:3000
pnpm --filter @tma-coffee-shop/bot dev      # long-poll
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
- **`.env` грузится в API из main.ts** через `dotenv` с явным path `process.cwd() + '../../.env'` **до** импорта `@nestjs/*`. Это критично: `PrismaService` читает `DATABASE_URL` в constructor, и без явной ранней загрузки получит `undefined`. Не переноси `loadEnv()` ниже импортов.
- **Кросс-платформенно** скрипты используют `node --env-file=../../.env` (Node 20+ нативный флаг). Если nest watch висит и не может занять порт — остался zombie от предыдущего запуска: `netstat -ano | grep ":3001"` → `taskkill //F //PID <pid>`.
