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
    <section className="px-5 mb-10">
      <header className="flex items-baseline justify-between mb-4">
        <h2 className="font-display font-semibold text-2xl text-ink">
          {category.name}
        </h2>
        <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-mute tabular-nums">
          {String(products.length).padStart(2, '0')} позиций
        </span>
      </header>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            categorySlug={category.slug}
          />
        ))}
      </div>
    </section>
  );
}
