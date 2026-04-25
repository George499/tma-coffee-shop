# TMA Coffee Shop

Telegram Mini App: catalog and cart for a coffee shop. Orders are delivered to an admin Telegram chat via a bot. Built as a portfolio piece showcasing the Telegram Mini Apps SDK, NestJS, Prisma, and a small monorepo deployment.

## Stack

- **Monorepo:** pnpm workspaces
- **Web:** Next.js 16 (App Router, React 19), TypeScript, Tailwind v4, `@telegram-apps/sdk-react`, TanStack Query, Zustand, react-hook-form, zod
- **API:** NestJS, Prisma, PostgreSQL 16, class-validator
- **Bot:** grammy
- **Deploy:** Vercel (web), Railway (api, bot, db)

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

## Local development

Requires Node 20+ and pnpm 10+.

```bash
pnpm install
cp .env.example .env
# fill in DATABASE_URL, TELEGRAM_BOT_TOKEN, ADMIN_CHAT_ID

pnpm dev
```

## Scripts

| Command           | What it does                                     |
| ----------------- | ------------------------------------------------ |
| `pnpm dev`        | Run all apps in parallel in development mode     |
| `pnpm build`      | Build every workspace                            |
| `pnpm lint`       | Lint every workspace                             |
| `pnpm typecheck`  | Type-check every workspace                       |
