'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { useCart, selectQuantityFor } from '@/lib/cart-store';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

const STEAM_CATEGORIES = new Set(['coffee', 'tea']);

export function ProductModal({
  product,
  categorySlug,
  open,
  onClose,
}: {
  product: Product;
  categorySlug: string;
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const quantity = useCart(selectQuantityFor(product.id));
  const add = useCart((s) => s.add);
  const decrement = useCart((s) => s.decrement);

  // Open / close the native <dialog>. showModal() also locks page scroll
  // and sets focus inside, so we don't need a custom focus trap.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      document.body.style.overflow = 'hidden';
    }
    if (!open && el.open) {
      el.close();
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Telegram WebView passes ESC through; we also handle backdrop clicks.
  const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  const showSteam = STEAM_CATEGORIES.has(categorySlug);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleClick}
      className="product-modal"
    >
      <div
        className="mx-auto w-full max-w-lg bg-cream rounded-t-3xl sm:rounded-3xl sm:my-6 overflow-hidden flex flex-col max-h-[92dvh]"
        style={{ boxShadow: '0 30px 60px -20px rgba(26, 22, 18, 0.45)' }}
      >
        <div className="relative aspect-square bg-ink overflow-hidden">
          {product.imageUrl && (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 32rem"
              className="object-cover"
              priority
            />
          )}
          {showSteam && (
            <div className="steam" aria-hidden="true">
              <span className="steam__plume steam__plume--a" />
              <span className="steam__plume steam__plume--b" />
              <span className="steam__plume steam__plume--c" />
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="absolute top-3 right-3 w-9 h-9 grid place-items-center bg-cream/95 text-ink rounded-full text-base font-medium shadow-sm active:scale-95 transition-transform"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6 flex flex-col gap-4">
          <div>
            <p className="font-sans text-[11px] uppercase tracking-[0.18em] text-accent">
              {categorySlug}
            </p>
            <h2 className="mt-1 font-display text-3xl leading-tight text-ink">
              {product.name}
            </h2>
          </div>

          {product.description && (
            <p className="text-sm text-mute leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="h-px bg-line-soft" />

          <div className="flex items-center justify-between gap-3">
            <span className="font-display text-2xl tabular-nums text-ink">
              {formatPrice(product.price)}
            </span>
            {quantity === 0 ? (
              <button
                type="button"
                onClick={() => add(product)}
                className="bg-ink text-cream rounded-full px-6 py-3 font-sans font-medium text-sm active:scale-[0.98] transition-transform"
              >
                Добавить в корзину
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-bone rounded-full px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => decrement(product.id)}
                  aria-label={`Убрать одну ${product.name}`}
                  className="w-9 h-9 grid place-items-center text-ink text-lg font-medium active:scale-95 transition-transform"
                >
                  −
                </button>
                <span className="font-display text-lg tabular-nums min-w-[1.5rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => add(product)}
                  aria-label={`Добавить ещё ${product.name}`}
                  className="w-9 h-9 grid place-items-center bg-accent text-cream rounded-full text-lg font-medium active:scale-95 transition-transform"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
