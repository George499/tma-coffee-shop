// Idempotent script to update only product imageUrl fields without touching
// orders or anything else. Use when the catalog is already seeded in prod
// and you want to roll out new images without re-running seed.ts (which
// destructively deletes products + cascades into order_items).
//
// Run: pnpm --filter @tma-coffee-shop/api node --env-file=../../.env scripts/update-product-images.ts

import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// Map: product name (as seeded) → slug used for /products/<slug>.jpg
const NAME_TO_SLUG: Record<string, string> = {
  Espresso: 'espresso',
  Americano: 'americano',
  Cappuccino: 'cappuccino',
  Latte: 'latte',
  'Black tea': 'black-tea',
  'Green tea': 'green-tea',
  'Herbal infusion': 'herbal-infusion',
  Croissant: 'croissant',
  'Cinnamon roll': 'cinnamon-roll',
};

async function main(): Promise<void> {
  let updated = 0;
  let missing: string[] = [];

  for (const [name, slug] of Object.entries(NAME_TO_SLUG)) {
    const result = await prisma.product.updateMany({
      where: { name },
      data: { imageUrl: `/products/${slug}.jpg` },
    });
    if (result.count === 0) {
      missing.push(name);
    } else {
      updated += result.count;
    }
  }

  console.log(`Updated imageUrl on ${updated} product(s).`);
  if (missing.length > 0) {
    console.warn(`Missing in DB (no rows matched): ${missing.join(', ')}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
