# TMA Coffee Shop — контекст для Claude Code

Это файл-инструкция. Читай его перед каждой задачей в этом проекте.

## Что мы делаем

Telegram Mini App "Кофейня" — каталог + корзина с отправкой заказа в Telegram-чат админа. Это **портфолио-проект**, не реальный продукт. Цель — показать заказчикам на фрилансе работу с TMA SDK, NestJS-бэком, Prisma, деплоем.

## Стек (фиксированный, не предлагать альтернативы без запроса)

- **Монорепо**: pnpm workspaces
- **Web**: Next.js 15 (App Router) + TypeScript + Tailwind + `@telegram-apps/sdk-react` + TanStack Query + Zustand + react-hook-form + zod
- **API**: NestJS + Prisma + Postgres + class-validator
- **Bot**: grammy
- **Деплой**: Vercel (web) + Railway (api, bot, db)
- **DB**: Postgres 16

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
