'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { ApiError, api } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import type { Order } from '@/lib/types';

const STATUS_LABEL: Record<Order['status'], string> = {
  NEW: 'Принят, ждём подтверждения от кофейни',
  ACCEPTED: 'Готовится',
  READY: 'Готов к выдаче',
  COMPLETED: 'Выдан',
  CANCELLED: 'Отменён',
};

// Adaptive polling: tighter for fresh orders that need quick admin feedback,
// looser once accepted, off for terminal states.
const POLL_INTERVAL_MS: Record<Order['status'], number | false> = {
  NEW: 3000,
  ACCEPTED: 5000,
  READY: false,
  COMPLETED: false,
  CANCELLED: false,
};

function usePageVisible(): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    handler();
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);
  return visible;
}

const DELIVERY_LABEL: Record<Order['deliveryType'], string> = {
  PICKUP: 'Самовывоз',
  DELIVERY: 'Доставка',
};

function formatScheduled(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const visible = usePageVisible();
  const query = useQuery<Order, Error>({
    queryKey: ['order', id],
    queryFn: () => api.getOrder(id),
    retry: false,
    refetchInterval: (q) => {
      if (!visible) return false;
      const status = q.state.data?.status;
      if (!status) return false;
      return POLL_INTERVAL_MS[status];
    },
    refetchIntervalInBackground: false,
  });

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-3 py-4 flex flex-col gap-4">
      <header className="flex items-center justify-between gap-2 px-1">
        <h1 className="text-tg-text text-2xl font-semibold">Заказ</h1>
        <Link href="/" className="text-tg-link text-sm">
          ← Каталог
        </Link>
      </header>

      {query.isPending && (
        <p className="text-tg-hint text-sm px-1">Загрузка заказа…</p>
      )}

      {query.isError && (
        <p className="text-tg-destructive text-sm px-1">
          {query.error instanceof ApiError && query.error.status === 404
            ? 'Заказ не найден'
            : query.error instanceof ApiError && query.error.status === 403
              ? 'У вас нет доступа к этому заказу'
              : 'Не удалось загрузить заказ'}
        </p>
      )}

      {query.data && <OrderDetails order={query.data} />}
    </main>
  );
}

function OrderDetails({ order }: { order: Order }) {
  return (
    <>
      <section className="bg-tg-section-bg rounded-2xl p-3 flex flex-col gap-1">
        <p className="text-tg-hint text-xs">№ {order.id}</p>
        <p className="text-tg-text font-semibold">{STATUS_LABEL[order.status]}</p>
      </section>

      <section className="bg-tg-section-bg rounded-2xl p-3 flex flex-col gap-2">
        <h2 className="text-tg-section-header-text uppercase text-xs font-semibold tracking-wider">
          Состав
        </h2>
        <ul className="flex flex-col gap-1.5">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="text-tg-text">
                {item.productName}
                <span className="text-tg-hint"> × {item.quantity}</span>
              </span>
              <span className="text-tg-text tabular-nums">
                {formatPrice(item.productPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between border-t border-tg-secondary-bg pt-2">
          <span className="text-tg-text font-semibold">Итого</span>
          <span className="text-tg-text font-semibold tabular-nums">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </section>

      <section className="bg-tg-section-bg rounded-2xl p-3 flex flex-col gap-2 text-sm">
        <Row label="Получение" value={DELIVERY_LABEL[order.deliveryType]} />
        {order.address && <Row label="Адрес" value={order.address} />}
        {order.scheduledAt && (
          <Row label="Время" value={formatScheduled(order.scheduledAt)} />
        )}
        <Row label="Имя" value={order.customerName} />
        <Row label="Телефон" value={order.customerPhone} />
        {order.comment && <Row label="Комментарий" value={order.comment} />}
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-tg-hint">{label}</span>
      <span className="text-tg-text text-right">{value}</span>
    </div>
  );
}
