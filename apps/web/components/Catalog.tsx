'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Category, Product } from '@/lib/types';
import { CategorySection } from './CategorySection';

export function Catalog() {
  const categoriesQuery = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: api.categories,
  });
  const productsQuery = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: api.products,
  });

  if (categoriesQuery.isPending || productsQuery.isPending) {
    return <p className="text-tg-hint text-sm px-1">Loading menu…</p>;
  }

  if (categoriesQuery.isError || productsQuery.isError) {
    return (
      <p className="text-tg-destructive text-sm px-1">
        Failed to load the menu. Try again later.
      </p>
    );
  }

  const productsByCategory = new Map<number, Product[]>();
  for (const product of productsQuery.data) {
    const list = productsByCategory.get(product.categoryId) ?? [];
    list.push(product);
    productsByCategory.set(product.categoryId, list);
  }

  return (
    <div className="flex flex-col gap-6">
      {categoriesQuery.data.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          products={productsByCategory.get(category.id) ?? []}
        />
      ))}
    </div>
  );
}
