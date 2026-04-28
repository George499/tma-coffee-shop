# TMA Coffee Shop

Telegram Mini App: catalog and cart for a coffee shop. Orders are delivered to an admin Telegram chat via a bot. Built as a portfolio piece showcasing the Telegram Mini Apps SDK, NestJS, Prisma, and a small monorepo deployment.

## Stack

- **Monorepo:** pnpm workspaces
- **Web:** Next.js 16 (App Router, React 19), TypeScript, Tailwind v4, `@telegram-apps/sdk-react`, TanStack Query, Zustand, react-hook-form, zod
- **API:** NestJS 11, Prisma 7 (with `@prisma/adapter-neon`), PostgreSQL (Neon serverless), class-validator
- **Bot:** grammy, hosted in-process inside the API as a Telegram webhook
- **Deploy:** Vercel (web), Render free tier (api + bot in one service), Neon (Postgres)

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
   - `NEXT_PUBLIC_API_URL` = your Render API URL (e.g. `https://tma-coffee-shop-api.onrender.com`)
   - `NEXT_PUBLIC_BOT_USERNAME` = your bot's username (no `@`)
5. Deploy. Note the production URL — you'll need it for `WEB_ORIGIN` on the API and for BotFather.

### API + bot → Render

The API and the Telegram webhook live in the same process. The repo ships a `render.yaml` Blueprint and a multi-stage `apps/api/Dockerfile`.

1. **Push** the repo to GitHub if you haven't already.
2. **Render dashboard** → **New** → **Blueprint** → select this repo. Render reads `render.yaml` and creates a `tma-coffee-shop-api` web service on the free tier.
3. Fill the **secret** env vars on the new service:
   - `DATABASE_URL` — your Neon connection string
   - `TELEGRAM_BOT_TOKEN` — the bot token
   - `ADMIN_CHAT_ID` — your Telegram user id (the one that should receive new-order alerts)
   - `WEB_ORIGIN` — the Vercel URL of the web app
   - `TELEGRAM_WEBHOOK_URL` — `https://<your-render-service>.onrender.com/api/telegram/webhook`
   - `BOT_API_SECRET` and `TELEGRAM_WEBHOOK_SECRET` are auto-generated by the Blueprint; you can rotate them manually if you wish.
4. Trigger a deploy. The first build pulls the Docker image, runs `prisma generate`, and starts the API. On boot the API calls Telegram's `setWebhook`, after which Telegram POSTs every update to `/api/telegram/webhook`.

Render free tier sleeps after 15 minutes of inactivity. The first request after a sleep takes ~30 s while the dyno wakes. To keep the API warm, point a free [UptimeRobot](https://uptimerobot.com/) HTTP monitor at `https://<your-api>.onrender.com/api/categories` with a 5-minute interval — that endpoint is unauthenticated and cheap, and the 5-min cadence stays inside the 15-min sleep window.

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
