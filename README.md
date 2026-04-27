# TMA Coffee Shop

Telegram Mini App: catalog and cart for a coffee shop. Orders are delivered to an admin Telegram chat via a bot. Built as a portfolio piece showcasing the Telegram Mini Apps SDK, NestJS, Prisma, and a small monorepo deployment.

## Stack

- **Monorepo:** pnpm workspaces
- **Web:** Next.js 16 (App Router, React 19), TypeScript, Tailwind v4, `@telegram-apps/sdk-react`, TanStack Query, Zustand, react-hook-form, zod
- **API:** NestJS 11, Prisma 7 (with `@prisma/adapter-neon`), PostgreSQL (Neon serverless), class-validator
- **Bot:** grammy
- **Deploy:** Vercel (web), Neon (Postgres); api and bot deployment TBD

## Layout

```
tma-coffee-shop/
├── apps/
│   ├── web/      # Next.js mini app
│   ├── api/      # NestJS REST API
│   └── bot/      # grammy bot
├── packages/
│   └── shared/   # shared types and zod schemas
└── ...
```

## Prerequisites

- Node.js 20+
- pnpm 10+ (`npm install -g pnpm`)
- A Neon project with a Postgres database
- A Telegram bot created via [@BotFather](https://t.me/BotFather)

## Setup

```bash
git clone https://github.com/George499/tma-coffee-shop.git
cd tma-coffee-shop
pnpm install
cp .env.example .env
```

`.env.example` ships with working values for the portfolio demo (a Neon connection string, a Telegram bot token, an admin chat id). They are intentionally committed so the project clones and runs out of the box. Replace them with your own and remove the file from version control before any real deployment.

Apply the database schema and seed sample data:

```bash
pnpm --filter @tma-coffee-shop/api prisma:generate
pnpm --filter @tma-coffee-shop/api prisma:migrate
pnpm --filter @tma-coffee-shop/api prisma:seed
```

## Local development

Run each app in a separate terminal:

```bash
pnpm --filter @tma-coffee-shop/api dev      # http://localhost:3001
pnpm --filter @tma-coffee-shop/web dev      # http://localhost:3000
pnpm --filter @tma-coffee-shop/bot dev      # long-poll
```

Or run everything in parallel from the repo root:

```bash
pnpm dev
```

## Scripts

| Command                                      | What it does                                  |
| -------------------------------------------- | --------------------------------------------- |
| `pnpm dev`                                   | Run all workspaces in parallel                |
| `pnpm build`                                 | Build every workspace                         |
| `pnpm lint`                                  | Lint every workspace                          |
| `pnpm typecheck`                             | Type-check every workspace                    |
| `pnpm --filter @tma-coffee-shop/api prisma:studio` | Open Prisma Studio against Neon         |
| `pnpm --filter @tma-coffee-shop/api prisma:seed`   | Reset and seed catalog data             |

## Tests

```bash
cd apps/api && npx jest --testPathPatterns=init-data
```

## Endpoints

| Method | Path                            | Auth         | Notes                                |
| ------ | ------------------------------- | ------------ | ------------------------------------ |
| GET    | `/api/categories`               | public       | Sorted by `sortOrder`                |
| GET    | `/api/products`                 | public       | Optional `?categoryId=N`             |
| GET    | `/api/me`                       | TMA initData | Returns the authenticated TG user    |

Authenticated requests must include `Authorization: tma <initDataRaw>`. The header is built automatically by `tmaFetch()` in `apps/web/lib/api.ts` when running inside Telegram.

## Project notes

- Keep the project path free of non-ASCII characters (e.g. `C:\dev\tma-coffee-shop`). Turbopack panics on UTF-8 path bytes.
- Placeholder product images come from picsum.photos and are marked `unoptimized` in `<Image>` to bypass Next's SSRF guard on networks that resolve picsum into private IP ranges.
- Prices are stored as `Int` kopecks; rendering is done client-side via `Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' })`.
