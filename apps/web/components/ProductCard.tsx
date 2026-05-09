'use client';

import Image from 'next/image';
import { useCart, selectQuantityFor } from '@/lib/cart-store';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

const STEAM_CATEGORIES = new Set(['coffee', 'tea']);

export function ProductCard({
  product,
  categorySlug,
  isLastInRow,
}: {
  product: Product;
  categorySlug: string;
  /** Skip the right border on the last cell of a row to avoid doubling. */
  isLastInRow: boolean;
}) {
  const quantity = useCart(selectQuantityFor(product.id));
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);

  const showSteam = STEAM_CATEGORIES.has(categorySlug);

  return (
    <article
      className={`relative flex flex-col bg-card border-b-2 border-ink ${
        isLastInRow ? '' : 'border-r-2'
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-ink">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-mute text-xs font-mono uppercase">
            no image
          </div>
        )}
        {showSteam && (
          <div className="steam" aria-hidden="true">
            <span className="steam__plume steam__plume--a" />
            <span className="steam__plume steam__plume--b" />
            <span className="steam__plume steam__plume--c" />
          </div>
        )}
        <span className="absolute top-2 left-2 font-mono text-[10px] uppercase tracking-[0.18em] bg-paper text-ink px-1.5 py-0.5 border-2 border-ink">
          № {String(product.id).padStart(2, '0')}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-3 flex-1">
        <h3 className="font-display font-bold text-base leading-tight uppercase">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-mute text-xs leading-snug line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <span className="font-mono font-bold text-base tabular-nums">
            {formatPrice(product.price)}
          </span>
          {quantity === 0 ? (
            <button
              type="button"
              onClick={() => add(product)}
              aria-label={`Add ${product.name} to cart`}
              className="border-2 border-ink bg-accent text-accent-ink w-9 h-9 grid place-items-center text-xl font-bold leading-none active:translate-y-[1px] transition-transform"
            >
              +
            </button>
          ) : (
            <div className="flex items-stretch border-2 border-ink">
              <button
                type="button"
                onClick={() => decrement(product.id)}
                aria-label={`Remove one ${product.name}`}
                className="w-8 h-8 grid place-items-center text-base font-bold leading-none active:bg-ink active:text-paper transition-colors"
              >
                −
              </button>
              <span className="w-7 grid place-items-center font-mono font-bold tabular-nums border-x-2 border-ink">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => add(product)}
                aria-label={`Add another ${product.name}`}
                className="w-8 h-8 grid place-items-center bg-accent text-accent-ink text-base font-bold leading-none active:bg-ink active:text-paper transition-colors"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
