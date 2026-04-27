import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

type ProductSeed = {
  slug: string; // used to derive the picsum image URL
  name: string;
  description: string;
  price: number; // kopecks
};

const placeholderImage = (slug: string) =>
  `https://picsum.photos/seed/coffee-shop-${slug}/600/600`;

const catalog: Array<{
  category: { name: string; slug: string; sortOrder: number };
  products: ProductSeed[];
}> = [
  {
    category: { name: 'Coffee', slug: 'coffee', sortOrder: 1 },
    products: [
      {
        slug: 'espresso',
        name: 'Espresso',
        description: 'Single shot, 30 ml',
        price: 18000,
      },
      {
        slug: 'americano',
        name: 'Americano',
        description: 'Espresso with hot water',
        price: 22000,
      },
      {
        slug: 'cappuccino',
        name: 'Cappuccino',
        description: 'Espresso with steamed milk and foam',
        price: 28000,
      },
      {
        slug: 'latte',
        name: 'Latte',
        description: 'Espresso with steamed milk',
        price: 30000,
      },
    ],
  },
  {
    category: { name: 'Tea', slug: 'tea', sortOrder: 2 },
    products: [
      {
        slug: 'black-tea',
        name: 'Black tea',
        description: 'Earl Grey, 400 ml',
        price: 18000,
      },
      {
        slug: 'green-tea',
        name: 'Green tea',
        description: 'Sencha, 400 ml',
        price: 18000,
      },
      {
        slug: 'herbal-infusion',
        name: 'Herbal infusion',
        description: 'Mint and chamomile',
        price: 20000,
      },
    ],
  },
  {
    category: { name: 'Bakery', slug: 'bakery', sortOrder: 3 },
    products: [
      {
        slug: 'croissant',
        name: 'Croissant',
        description: 'Classic French butter croissant',
        price: 19000,
      },
      {
        slug: 'cinnamon-roll',
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
          imageUrl: placeholderImage(product.slug),
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
