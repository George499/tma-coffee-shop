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
    return (
      <p className="font-sans text-sm text-mute px-5 py-6">
        Загружаем меню…
      </p>
    );
  }

  if (categoriesQuery.isError || productsQuery.isError) {
    return (
      <p className="font-sans text-sm text-danger px-5 py-6">
        Не удалось загрузить меню. Попробуйте позже.
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
    <div>
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
