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
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 py-4">
        <p className="text-tg-hint text-sm px-1">Загрузка корзины…</p>
      </main>
    );
  }

  if (totalQuantity === 0) {
    return (
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 py-4">
        <p className="text-tg-hint text-sm px-1">
          Корзина пустая.{' '}
          <Link href="/" className="text-tg-link underline">
            Вернуться в каталог
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
    'w-full rounded-xl bg-tg-secondary-bg text-tg-text px-3 py-2 outline-none border border-transparent focus:border-tg-button';
  const labelClass = 'text-tg-text text-sm font-medium';
  const errorClass = 'text-tg-destructive text-xs';

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-3 py-4 flex flex-col gap-4">
      <header className="flex items-center justify-between gap-2 px-1">
        <h1 className="text-tg-text text-2xl font-semibold">Оформление</h1>
        <Link href="/" className="text-tg-link text-sm">
          ← Каталог
        </Link>
      </header>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <section className="bg-tg-section-bg rounded-2xl p-3 flex flex-col gap-2">
          <h2 className="text-tg-section-header-text uppercase text-xs font-semibold tracking-wider">
            Заказ
          </h2>
          <ul className="flex flex-col gap-1.5">
            {Object.values(items).map((entry) => (
              <li
                key={entry.product.id}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="text-tg-text">
                  {entry.product.name}
                  <span className="text-tg-hint"> × {entry.quantity}</span>
                </span>
                <span className="text-tg-text tabular-nums">
                  {formatPrice(entry.product.price * entry.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t border-tg-secondary-bg pt-2">
            <span className="text-tg-text font-semibold">Итого</span>
            <span className="text-tg-text font-semibold tabular-nums">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </section>

        <section className="bg-tg-section-bg rounded-2xl p-3 flex flex-col gap-3">
          <h2 className="text-tg-section-header-text uppercase text-xs font-semibold tracking-wider">
            Контакты
          </h2>

          <div className="flex flex-col gap-1">
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

          <div className="flex flex-col gap-1">
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

        <section className="bg-tg-section-bg rounded-2xl p-3 flex flex-col gap-3">
          <h2 className="text-tg-section-header-text uppercase text-xs font-semibold tracking-wider">
            Получение
          </h2>

          <fieldset className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                value={DeliveryType.PICKUP}
                className="peer sr-only"
                {...register('deliveryType')}
              />
              <span className="block text-center rounded-xl bg-tg-secondary-bg text-tg-text px-3 py-2 peer-checked:bg-tg-button peer-checked:text-tg-button-text">
                Самовывоз
              </span>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                value={DeliveryType.DELIVERY}
                className="peer sr-only"
                {...register('deliveryType')}
              />
              <span className="block text-center rounded-xl bg-tg-secondary-bg text-tg-text px-3 py-2 peer-checked:bg-tg-button peer-checked:text-tg-button-text">
                Доставка
              </span>
            </label>
          </fieldset>

          {deliveryType === DeliveryType.DELIVERY && (
            <div className="flex flex-col gap-1">
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

          <div className="flex flex-col gap-1">
            <label htmlFor="scheduledAt" className={labelClass}>
              Желаемое время <span className="text-tg-hint">(необязательно)</span>
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

          <div className="flex flex-col gap-1">
            <label htmlFor="comment" className={labelClass}>
              Комментарий <span className="text-tg-hint">(необязательно)</span>
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

        <p className="text-tg-hint text-xs px-1">
          Оплата при получении в кофейне.
        </p>

        {submitError && (
          <p className="text-tg-destructive text-sm px-1">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-tg-button text-tg-button-text rounded-2xl px-4 py-3 font-semibold active:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {isSubmitting ? 'Отправляем…' : `Оформить заказ · ${formatPrice(totalPrice)}`}
        </button>
      </form>
    </main>
  );
}
