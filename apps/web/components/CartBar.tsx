'use client';

import Link from 'next/link';
import {
  selectTotalPrice,
  selectTotalQuantity,
  useCart,
} from '@/lib/cart-store';
import { formatPrice } from '@/lib/format';

function pluralizeItems(count: number): string {
  // ru-RU plural: 1 товар, 2-4 товара, 5+ товаров (also 11-14 -> товаров).
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'товар';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'товара';
  return 'товаров';
}

export function CartBar() {
  const hasHydrated = useCart((s) => s.hasHydrated);
  const totalQuantity = useCart(selectTotalQuantity);
  const totalPrice = useCart(selectTotalPrice);

  // Render nothing until persisted state has rehydrated, otherwise the
  // server-rendered "empty cart" branch would not match the client's
  // hydrated cart and React would warn about a mismatch.
  if (!hasHydrated || totalQuantity === 0) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 px-4 pt-3"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <Link
        href="/checkout"
        className="block max-w-4xl mx-auto bg-ink text-cream rounded-full active:scale-[0.99] transition-transform"
        style={{ boxShadow: '0 16px 40px -10px rgba(26, 22, 18, 0.45)' }}
      >
        <span className="flex items-center justify-between gap-3 pl-5 pr-2 py-2">
          <span className="flex items-baseline gap-2">
            <span className="font-display font-medium text-base">
              {totalQuantity} {pluralizeItems(totalQuantity)}
            </span>
            <span className="font-sans text-xs text-cream/60 tabular-nums">
              {formatPrice(totalPrice)}
            </span>
          </span>
          <span className="flex items-center gap-2 bg-accent text-cream rounded-full pl-4 pr-3 py-2.5">
            <span className="font-sans font-medium text-sm">К оформлению</span>
            <span aria-hidden="true">→</span>
          </span>
        </span>
      </Link>
    </div>
  );
}
