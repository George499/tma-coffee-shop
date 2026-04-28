'use client';

import Image from 'next/image';
import { useCart, selectQuantityFor } from '@/lib/cart-store';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

export function ProductCard({ product }: { product: Product }) {
  const quantity = useCart(selectQuantityFor(product.id));
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);

  return (
    <article className="bg-tg-section-bg rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="relative aspect-square bg-tg-secondary-bg">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            // Picsum redirects to a CDN that some networks proxy through CGN
            // ranges, which Next's image optimiser blocks as a private IP.
            // Skip the proxy until real product images replace placeholders.
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-tg-hint text-sm">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3 flex-1">
        <h3 className="text-tg-text font-semibold leading-tight">{product.name}</h3>
        {product.description && (
          <p className="text-tg-hint text-sm leading-snug line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <span className="text-tg-text font-semibold">
            {formatPrice(product.price)}
          </span>
          {quantity === 0 ? (
            <button
              type="button"
              onClick={() => add(product)}
              aria-label={`Add ${product.name} to cart`}
              className="bg-tg-button text-tg-button-text rounded-full w-8 h-8 grid place-items-center text-lg font-semibold leading-none active:opacity-80 transition-opacity"
            >
              +
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-tg-secondary-bg rounded-full">
              <button
                type="button"
                onClick={() => decrement(product.id)}
                aria-label={`Remove one ${product.name}`}
                className="w-8 h-8 grid place-items-center text-tg-text text-lg font-semibold leading-none active:opacity-60"
              >
                −
              </button>
              <span className="text-tg-text font-semibold min-w-[1.25rem] text-center tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => add(product)}
                aria-label={`Add another ${product.name}`}
                className="w-8 h-8 grid place-items-center text-tg-text text-lg font-semibold leading-none active:opacity-60"
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
