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

const STATUS_TAG: Record<Order['status'], string> = {
  NEW: 'NEW',
  ACCEPTED: 'IN PROGRESS',
  READY: 'READY',
  COMPLETED: 'DONE',
  CANCELLED: 'CANCELLED',
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
    <main className="flex-1 max-w-4xl w-full mx-auto pb-12">
      <header className="px-5 pt-6 pb-5 border-b-2 border-ink flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-mute">
            шаг 03 · подтверждение
          </p>
          <h1 className="mt-2 font-display font-bold text-[clamp(2rem,7vw,3.5rem)] leading-[0.95] tracking-tight uppercase">
            Order
          </h1>
        </div>
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.18em] underline whitespace-nowrap"
        >
          ← каталог
        </Link>
      </header>

      <div className="px-5 pt-5 flex flex-col gap-4">
        {query.isPending && (
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-mute">
            загрузка заказа…
          </p>
        )}

        {query.isError && (
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-danger">
            {query.error instanceof ApiError && query.error.status === 404
              ? 'заказ не найден'
              : query.error instanceof ApiError && query.error.status === 403
                ? 'нет доступа к этому заказу'
                : 'не удалось загрузить заказ'}
          </p>
        )}

        {query.data && <OrderDetails order={query.data} />}
      </div>
    </main>
  );
}

function OrderDetails({ order }: { order: Order }) {
  const sectionClass = 'border-2 border-ink bg-card p-4 flex flex-col gap-2';
  const sectionHeader =
    'font-mono text-[10px] uppercase tracking-[0.25em] text-ink border-b-2 border-ink pb-2';

  return (
    <>
      <section
        className="border-2 border-ink bg-ink text-paper p-4 flex flex-col gap-2"
        style={{ boxShadow: '6px 6px 0 0 var(--color-accent)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-paper/60">
            № {order.id.slice(0, 12)}…
          </p>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] bg-accent text-accent-ink px-1.5 py-0.5 border-2 border-paper">
            {STATUS_TAG[order.status]}
          </span>
        </div>
        <p className="font-display font-bold uppercase text-lg">
          {STATUS_LABEL[order.status]}
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionHeader}>/ Состав</h2>
        <ul className="flex flex-col gap-1.5 pt-1">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span>
                {item.productName}
                <span className="text-mute font-mono"> × {item.quantity}</span>
              </span>
              <span className="font-mono tabular-nums">
                {formatPrice(item.productPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between border-t-2 border-ink pt-2 mt-1">
          <span className="font-display font-bold uppercase">Итого</span>
          <span className="font-mono font-bold text-lg tabular-nums">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionHeader}>/ Детали</h2>
        <div className="flex flex-col gap-1.5 pt-1 text-sm">
          <Row label="Получение" value={DELIVERY_LABEL[order.deliveryType]} />
          {order.address && <Row label="Адрес" value={order.address} />}
          {order.scheduledAt && (
            <Row label="Время" value={formatScheduled(order.scheduledAt)} />
          )}
          <Row label="Имя" value={order.customerName} />
          <Row label="Телефон" value={order.customerPhone} />
          {order.comment && <Row label="Комментарий" value={order.comment} />}
        </div>
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
        {label}
      </span>
      <span className="text-right">{value}</span>
    </div>
  );
}
