# TMA Coffee Shop

Telegram Mini App: catalog and cart for a coffee shop. Orders are delivered to an admin Telegram chat via a bot. Built as a portfolio piece showcasing the Telegram Mini Apps SDK, NestJS, Prisma, and a small monorepo deployment.

## Stack

- **Monorepo:** pnpm workspaces
- **Web:** Next.js 16 (App Router, React 19), TypeScript, Tailwind v4, `@telegram-apps/sdk-react`, TanStack Query, Zustand, react-hook-form, zod
- **API:** NestJS 11, Prisma 7 (with `@prisma/adapter-neon`), PostgreSQL (Neon serverless), class-validator
- **Bot:** grammy, hosted in-process inside the API as a Telegram webhook
- **Deploy:** Vercel (web), Railway (api + bot in one service), Neon (Postgres)

## Layout

```
tma-coffee-shop/
├── apps/
│   ├── web/      # Next.js mini app
│   └── api/      # NestJS REST API + Telegram webhook
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
pnpm --filter @tma-coffee-shop/api dev      # http://localhost:3001 (also long-polls Telegram if TELEGRAM_LONGPOLL=true)
pnpm --filter @tma-coffee-shop/web dev      # http://localhost:3000
```

Or run everything in parallel from the repo root:

```bash
pnpm dev
```

The Telegram bot lives inside the API process. In local dev set `TELEGRAM_LONGPOLL=true` in `.env` and the API will pull updates over long-poll. In production the API registers a webhook (see `TELEGRAM_WEBHOOK_URL` in `.env.example`) and Telegram POSTs updates to `/api/telegram/webhook`.

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

| Method | Path                                | Auth                          | Notes                                                  |
| ------ | ----------------------------------- | ----------------------------- | ------------------------------------------------------ |
| GET    | `/api/categories`                   | public                        | Sorted by `sortOrder`                                  |
| GET    | `/api/products`                     | public                        | Optional `?categoryId=N`                               |
| GET    | `/api/me`                           | TMA initData                  | Returns the authenticated TG user                      |
| POST   | `/api/orders`                       | TMA initData                  | Creates an order, totals recomputed server-side        |
| GET    | `/api/orders/:id`                   | TMA initData                  | Owner-only; 403 for foreign user, 404 if missing       |
| PATCH  | `/api/orders/:id/status`            | `X-Bot-Secret` header         | `accept`/`reject`; only valid from `NEW`               |
| POST   | `/api/telegram/webhook`             | `X-Telegram-Bot-Api-Secret-Token` | Telegram webhook receiver (production only)        |

`Authorization: tma <initDataRaw>` is added automatically by `tmaFetch()` in `apps/web/lib/api.ts` when the page runs inside Telegram.

## Deployment

### Web → Vercel

1. Import the repo in the Vercel dashboard.
2. Set **Root Directory** to `apps/web`.
3. Vercel reads `apps/web/vercel.json` and builds via the monorepo-aware command (it climbs to the repo root, runs `pnpm install --frozen-lockfile`, builds the `shared` package, then builds the web app).
4. Environment variables on the project:
   - `NEXT_PUBLIC_API_URL` = your Railway API URL (e.g. `https://tma-coffee-shop-api.up.railway.app`)
   - `NEXT_PUBLIC_BOT_USERNAME` = your bot's username (no `@`)
5. Deploy. Note the production URL — you'll need it for `WEB_ORIGIN` on the API and for BotFather.

### API + bot → Railway

The API and the Telegram webhook live in the same process. The repo ships a `railway.json` config and a multi-stage `apps/api/Dockerfile`.

1. **Push** the repo to GitHub if you haven't already.
2. **Railway dashboard** → **New Project** → **Deploy from GitHub repo** → select `tma-coffee-shop`. Railway reads `railway.json`, picks the `DOCKERFILE` builder with `apps/api/Dockerfile`, and provisions one service.
3. Open the service → **Variables** tab → add:
   - `DATABASE_URL` — your Neon connection string
   - `TELEGRAM_BOT_TOKEN` — the bot token
   - `ADMIN_CHAT_ID` — your Telegram user id (the one that should receive new-order alerts)
   - `WEB_ORIGIN` — the Vercel URL of the web app
   - `TELEGRAM_WEBHOOK_URL` — `https://<your-service>.up.railway.app/api/telegram/webhook` (after the public domain is generated in step 4)
   - `TELEGRAM_WEBHOOK_SECRET` — random hex (e.g. `openssl rand -hex 32`)
   - `BOT_API_SECRET` — random hex; only used by the dormant `PATCH /api/orders/:id/status` endpoint
   - `NODE_ENV=production`
4. **Settings** → **Networking** → **Generate Domain** to get the public URL. Copy it back into `TELEGRAM_WEBHOOK_URL` and trigger a redeploy so the API registers the webhook on boot.
5. Health check is configured to `/api/categories` in `railway.json`. The first deploy takes a few minutes while Docker builds the multi-stage image.

Railway charges by usage from the trial credit, then `$5/mo` Hobby plan; unlike Render's free tier the service does not sleep, so no keepalive is required.

### BotFather

Open [@BotFather](https://t.me/BotFather) and run:

1. `/mybots` → choose your bot → **Bot Settings** → **Menu Button** → **Configure menu button** → enter:
   - **Title:** `Меню`
   - **URL:** your Vercel URL
2. (Optional) `/setdomain` and paste the Vercel URL so deep links from your bot resolve correctly.

After this the user opens your bot in Telegram, taps the menu button (bottom-left of the chat), and the Mini App loads with full theme variables and `initData` populated.

## Project notes

- Keep the project path free of non-ASCII characters (e.g. `C:\dev\tma-coffee-shop`). Turbopack panics on UTF-8 path bytes.
- Placeholder product images come from picsum.photos and are marked `unoptimized` in `<Image>` to bypass Next's SSRF guard on networks that resolve picsum into private IP ranges.
- Prices are stored as `Int` kopecks; rendering is done client-side via `Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' })`.
