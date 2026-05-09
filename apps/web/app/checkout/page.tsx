'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { DeliveryType } from '@tma-coffee-shop/shared';
import { ApiError, api } from '@/lib/api';
import {
  selectTotalPrice,
  selectTotalQuantity,
  useCart,
} from '@/lib/cart-store';
import { type CheckoutFormValues, checkoutSchema } from '@/lib/checkout-schema';
import { formatPrice } from '@/lib/format';

function toMinDateTimeLocal(): string {
  // Earliest scheduled time the form accepts: now + 16 minutes (one minute
  // over the schema's 15-min server buffer to avoid edge clock skew).
  const t = new Date(Date.now() + 16 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const totalQuantity = useCart(selectTotalQuantity);
  const totalPrice = useCart(selectTotalPrice);
  const hasHydrated = useCart((s) => s.hasHydrated);
  const clear = useCart((s) => s.clear);

  const minScheduled = useMemo(() => toMinDateTimeLocal(), []);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      deliveryType: DeliveryType.PICKUP,
      address: '',
      scheduledAt: '',
      comment: '',
    },
  });

  const deliveryType = watch('deliveryType');

  // Hydrated empty cart is the only "go back" condition. Pre-hydration we
  // render a placeholder so we don't bounce a returning user before zustand
  // restores their items from localStorage.
  useEffect(() => {
    if (hasHydrated && totalQuantity === 0) {
      router.replace('/');
    }
  }, [hasHydrated, totalQuantity, router]);

  if (!hasHydrated) {
    return (
      <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-mute">
          загрузка корзины…
        </p>
      </main>
    );
  }

  if (totalQuantity === 0) {
    return (
      <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-mute">
          корзина пустая.{' '}
          <Link href="/" className="underline text-ink">
            вернуться в каталог
          </Link>
        </p>
      </main>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    const payload = {
      items: Object.values(items).map((entry) => ({
        productId: entry.product.id,
        quantity: entry.quantity,
      })),
      deliveryType: values.deliveryType,
      customerName: values.customerName.trim(),
      customerPhone: values.customerPhone.trim(),
      ...(values.deliveryType === DeliveryType.DELIVERY && values.address
        ? { address: values.address.trim() }
        : {}),
      ...(values.scheduledAt
        ? { scheduledAt: new Date(values.scheduledAt).toISOString() }
        : {}),
      ...(values.comment ? { comment: values.comment.trim() } : {}),
    };

    try {
      const order = await api.createOrder(payload);
      clear();
      router.replace(`/order/${order.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Не удалось оформить заказ');
      }
    }
  });

  const fieldClass =
    'w-full bg-card text-ink px-3 py-2.5 border-2 border-ink outline-none font-display placeholder:text-mute focus:bg-paper';
  const labelClass =
    'font-mono text-[10px] uppercase tracking-[0.2em] text-ink';
  const errorClass = 'font-mono text-[10px] uppercase tracking-[0.15em] text-danger';
  const sectionClass = 'border-2 border-ink bg-card p-4 flex flex-col gap-3';
  const sectionHeader =
    'font-mono text-[10px] uppercase tracking-[0.25em] text-ink border-b-2 border-ink pb-2';

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto pb-32">
      <header className="px-5 pt-6 pb-5 border-b-2 border-ink flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-mute">
            шаг 02 · оформление
          </p>
          <h1 className="mt-2 font-display font-bold text-[clamp(2rem,7vw,3.5rem)] leading-[0.95] tracking-tight uppercase">
            Checkout
          </h1>
        </div>
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.18em] underline whitespace-nowrap"
        >
          ← каталог
        </Link>
      </header>
      <form onSubmit={onSubmit} className="px-5 pt-5 flex flex-col gap-4" noValidate>
        <section className={sectionClass}>
          <h2 className={sectionHeader}>/ Заказ</h2>
          <ul className="flex flex-col gap-1.5">
            {Object.values(items).map((entry) => (
              <li
                key={entry.product.id}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span>
                  {entry.product.name}
                  <span className="text-mute font-mono"> × {entry.quantity}</span>
                </span>
                <span className="font-mono tabular-nums">
                  {formatPrice(entry.product.price * entry.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t-2 border-ink pt-2">
            <span className="font-display font-bold uppercase">Итого</span>
            <span className="font-mono font-bold text-lg tabular-nums">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className={sectionHeader}>/ Контакты</h2>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="customerName" className={labelClass}>
              Имя
            </label>
            <input
              id="customerName"
              autoComplete="name"
              className={fieldClass}
              {...register('customerName')}
            />
            {errors.customerName && (
              <p className={errorClass}>{errors.customerName.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="customerPhone" className={labelClass}>
              Телефон
            </label>
            <input
              id="customerPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+7 999 123-45-67"
              className={fieldClass}
              {...register('customerPhone')}
            />
            {errors.customerPhone && (
              <p className={errorClass}>{errors.customerPhone.message}</p>
            )}
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className={sectionHeader}>/ Получение</h2>

          <fieldset className="grid grid-cols-2 gap-0 border-2 border-ink">
            <label className="cursor-pointer">
              <input
                type="radio"
                value={DeliveryType.PICKUP}
                className="peer sr-only"
                {...register('deliveryType')}
              />
              <span className="block text-center font-display font-bold uppercase px-3 py-2.5 border-r-2 border-ink peer-checked:bg-ink peer-checked:text-paper">
                Самовывоз
              </span>
            </label>
            <label className="cursor-pointer">
              <input
                type="radio"
                value={DeliveryType.DELIVERY}
                className="peer sr-only"
                {...register('deliveryType')}
              />
              <span className="block text-center font-display font-bold uppercase px-3 py-2.5 peer-checked:bg-ink peer-checked:text-paper">
                Доставка
              </span>
            </label>
          </fieldset>

          {deliveryType === DeliveryType.DELIVERY && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="address" className={labelClass}>
                Адрес
              </label>
              <input
                id="address"
                autoComplete="street-address"
                className={fieldClass}
                {...register('address')}
              />
              {errors.address && (
                <p className={errorClass}>{errors.address.message}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="scheduledAt" className={labelClass}>
              Желаемое время <span className="text-mute">(необязательно)</span>
            </label>
            <input
              id="scheduledAt"
              type="datetime-local"
              min={minScheduled}
              className={fieldClass}
              {...register('scheduledAt')}
            />
            {errors.scheduledAt && (
              <p className={errorClass}>{errors.scheduledAt.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="comment" className={labelClass}>
              Комментарий <span className="text-mute">(необязательно)</span>
            </label>
            <textarea
              id="comment"
              rows={2}
              className={fieldClass}
              {...register('comment')}
            />
            {errors.comment && (
              <p className={errorClass}>{errors.comment.message}</p>
            )}
          </div>
        </section>

        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-mute px-1">
          оплата при получении в кофейне
        </p>

        {submitError && (
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-danger px-1">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-ink text-paper border-2 border-ink px-4 py-4 font-display font-bold uppercase text-lg tracking-wide active:translate-y-[2px] disabled:opacity-50 transition-transform"
          style={{ boxShadow: '6px 6px 0 0 var(--color-accent)' }}
        >
          {isSubmitting
            ? 'Отправляем…'
            : `Оформить · ${formatPrice(totalPrice)}`}
        </button>
      </form>
    </main>
  );
}
