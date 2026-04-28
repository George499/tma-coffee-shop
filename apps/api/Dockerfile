# syntax=docker/dockerfile:1.7
# Build context: monorepo root.
# In Render: set rootDir=. and dockerfilePath=apps/api/Dockerfile.

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

# ---- Install all deps (used by both build and runtime layers) ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---- Build the api + shared package, generate Prisma client ----
FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @tma-coffee-shop/shared build
RUN pnpm --filter @tma-coffee-shop/api prisma:generate
RUN pnpm --filter @tma-coffee-shop/api build

# ---- Runtime: reuse the deps layer's node_modules (already includes the
#      generated Prisma client written into it during build) plus dist output.
FROM base AS runtime
ENV NODE_ENV=production

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/shared/package.json packages/shared/
COPY --from=build /repo/packages/shared/dist packages/shared/dist
COPY --from=build /repo/apps/api/package.json apps/api/
COPY --from=build /repo/apps/api/prisma apps/api/prisma
COPY --from=build /repo/apps/api/dist apps/api/dist
COPY --from=build /repo/apps/api/node_modules apps/api/node_modules
COPY pnpm-workspace.yaml package.json ./

EXPOSE 3001
WORKDIR /repo/apps/api
CMD ["node", "dist/src/main.js"]
