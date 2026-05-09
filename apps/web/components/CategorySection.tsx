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
    <section className="border-b-2 border-ink">
      <header className="flex items-baseline justify-between px-5 py-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em]">
          / {category.name}
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute tabular-nums">
          {String(products.length).padStart(2, '0')} позиц.
        </span>
      </header>
      <div className="grid grid-cols-2 lg:grid-cols-3 border-t-2 border-ink">
        {products.map((product, idx) => (
          <ProductCard
            key={product.id}
            product={product}
            categorySlug={category.slug}
            isLastInRow={(idx + 1) % 2 === 0}
          />
        ))}
      </div>
    </section>
  );
}
