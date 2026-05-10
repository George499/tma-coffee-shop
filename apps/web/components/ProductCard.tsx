'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useCart, selectQuantityFor } from '@/lib/cart-store';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';
import { ProductModal } from './ProductModal';

const STEAM_CATEGORIES = new Set(['coffee', 'tea']);

export function ProductCard({
  product,
  categorySlug,
}: {
  product: Product;
  categorySlug: string;
}) {
  const quantity = useCart(selectQuantityFor(product.id));
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);
  const [open, setOpen] = useState(false);

  const showSteam = STEAM_CATEGORIES.has(categorySlug);

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <article
        onClick={() => setOpen(true)}
        className="group relative flex flex-col bg-card rounded-2xl overflow-hidden border border-line-soft active:scale-[0.99] transition-transform cursor-pointer"
        style={{ boxShadow: '0 1px 0 rgba(26, 22, 18, 0.04), 0 8px 24px -12px rgba(26, 22, 18, 0.18)' }}
      >
        <div className="relative aspect-square bg-ink overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-mute text-xs">
              нет изображения
            </div>
          )}
          {showSteam && (
            <div className="steam" aria-hidden="true">
              <span className="steam__plume steam__plume--a" />
              <span className="steam__plume steam__plume--b" />
              <span className="steam__plume steam__plume--c" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 p-3.5 flex-1">
          <h3 className="font-display text-lg leading-tight text-ink">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-mute text-xs leading-snug line-clamp-2 italic">
              {product.description}
            </p>
          )}
          <div className="mt-3 pt-3 border-t border-line-soft flex items-center justify-between gap-2">
            <span className="font-display text-lg tabular-nums text-ink">
              {formatPrice(product.price)}
            </span>
            {quantity === 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  stop(e);
                  add(product);
                }}
                aria-label={`Добавить ${product.name} в корзину`}
                className="w-9 h-9 grid place-items-center bg-accent text-cream rounded-full text-lg font-medium leading-none active:scale-95 transition-transform"
              >
                +
              </button>
            ) : (
              <div
                onClick={stop}
                className="flex items-center bg-bone rounded-full px-1 py-0.5"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    stop(e);
                    decrement(product.id);
                  }}
                  aria-label={`Убрать одну ${product.name}`}
                  className="w-7 h-7 grid place-items-center text-ink text-base font-medium leading-none active:scale-90 transition-transform"
                >
                  −
                </button>
                <span className="font-display tabular-nums min-w-[1.25rem] text-center text-sm">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    stop(e);
                    add(product);
                  }}
                  aria-label={`Добавить ещё ${product.name}`}
                  className="w-7 h-7 grid place-items-center bg-accent text-cream rounded-full text-base font-medium leading-none active:scale-90 transition-transform"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </article>

      <ProductModal
        product={product}
        categorySlug={categorySlug}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
