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
      className="fixed inset-x-0 bottom-0 z-50 px-3 pt-3"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <Link
        href="/checkout"
        className="block max-w-4xl mx-auto bg-tg-button text-tg-button-text rounded-2xl px-4 py-3 shadow-lg active:opacity-90 transition-opacity"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="font-semibold">
            В корзине {totalQuantity} {pluralizeItems(totalQuantity)}
          </span>
          <span className="font-semibold tabular-nums">
            {formatPrice(totalPrice)} →
          </span>
        </span>
      </Link>
    </div>
  );
}
