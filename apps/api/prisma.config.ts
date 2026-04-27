import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load .env from the monorepo root (two levels up from apps/api).
loadEnv({ path: path.resolve(__dirname, '../../.env') });

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
