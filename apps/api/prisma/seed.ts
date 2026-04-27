import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

type ProductSeed = {
  name: string;
  description: string;
  price: number; // kopecks
  imageUrl?: string;
};

const catalog: Array<{
  category: { name: string; slug: string; sortOrder: number };
  products: ProductSeed[];
}> = [
  {
    category: { name: 'Coffee', slug: 'coffee', sortOrder: 1 },
    products: [
      { name: 'Espresso', description: 'Single shot, 30 ml', price: 18000 },
      { name: 'Americano', description: 'Espresso with hot water', price: 22000 },
      {
        name: 'Cappuccino',
        description: 'Espresso with steamed milk and foam',
        price: 28000,
      },
      { name: 'Latte', description: 'Espresso with steamed milk', price: 30000 },
    ],
  },
  {
    category: { name: 'Tea', slug: 'tea', sortOrder: 2 },
    products: [
      { name: 'Black tea', description: 'Earl Grey, 400 ml', price: 18000 },
      { name: 'Green tea', description: 'Sencha, 400 ml', price: 18000 },
      { name: 'Herbal infusion', description: 'Mint and chamomile', price: 20000 },
    ],
  },
  {
    category: { name: 'Bakery', slug: 'bakery', sortOrder: 3 },
    products: [
      {
        name: 'Croissant',
        description: 'Classic French butter croissant',
        price: 19000,
      },
      {
        name: 'Cinnamon roll',
        description: 'Soft yeast bun with cinnamon glaze',
        price: 25000,
      },
    ],
  },
];

async function main(): Promise<void> {
  // Idempotent: clear data, then re-create.
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  for (const block of catalog) {
    const category = await prisma.category.create({ data: block.category });
    for (const product of block.products) {
      await prisma.product.create({
        data: {
          categoryId: category.id,
          name: product.name,
          description: product.description,
          price: product.price,
        },
      });
    }
  }

  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
  };
  console.log('Seed complete:', counts);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
