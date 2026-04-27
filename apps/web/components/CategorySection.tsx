import type { Category, Product } from '@/lib/types';
import { ProductCard } from './ProductCard';

export function CategorySection({
  category,
  products,
}: {
  category: Category;
  products: Product[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-tg-section-header-text uppercase text-xs font-semibold tracking-wider px-1">
        {category.name}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
