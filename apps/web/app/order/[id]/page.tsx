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

const STATUS_TONE: Record<Order['status'], string> = {
  NEW: 'bg-cream text-ink',
  ACCEPTED: 'bg-accent text-cream',
  READY: 'bg-forest text-cream',
  COMPLETED: 'bg-ink text-cream',
  CANCELLED: 'bg-danger text-cream',
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
      <header className="px-5 pt-7 pb-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-mute">
              шаг 03 · подтверждение
            </p>
            <h1 className="mt-2 font-display text-[clamp(2rem,7vw,3.25rem)] leading-[0.95] tracking-tight text-ink">
              Ваш
              <span className="text-accent"> заказ</span>
            </h1>
          </div>
          <Link
            href="/"
            className="font-sans text-sm text-mute hover:text-ink whitespace-nowrap"
          >
            ← каталог
          </Link>
        </div>
        <div className="mt-5 h-px bg-line" />
      </header>

      <div className="px-5 flex flex-col gap-4">
        {query.isPending && (
          <p className="text-sm text-mute">Загружаем заказ…</p>
        )}

        {query.isError && (
          <p className="font-sans text-sm text-danger">
            {query.error instanceof ApiError && query.error.status === 404
              ? 'Заказ не найден'
              : query.error instanceof ApiError && query.error.status === 403
                ? 'Нет доступа к этому заказу'
                : 'Не удалось загрузить заказ'}
          </p>
        )}

        {query.data && <OrderDetails order={query.data} />}
      </div>
    </main>
  );
}

function OrderDetails({ order }: { order: Order }) {
  const sectionClass =
    'bg-card rounded-2xl p-5 flex flex-col gap-2 border border-line-soft';
  const sectionHeader = 'font-display font-semibold text-xl text-ink';

  return (
    <>
      <section
        className={`rounded-2xl p-5 flex flex-col gap-3 ${STATUS_TONE[order.status]}`}
        style={{ boxShadow: '0 16px 40px -16px rgba(26, 22, 18, 0.35)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="font-sans text-[11px] tracking-[0.2em] uppercase opacity-70">
            № {order.id.slice(0, 12)}…
          </p>
          <span className="font-sans text-[11px] uppercase tracking-[0.18em] bg-cream/20 px-2 py-0.5 rounded-full">
            {order.status}
          </span>
        </div>
        <p className="font-display text-xl leading-snug">
          {STATUS_LABEL[order.status]}
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionHeader}>Состав</h2>
        <ul className="flex flex-col gap-2 pt-1">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span>
                {item.productName}
                <span className="text-mute font-sans"> × {item.quantity}</span>
              </span>
              <span className="font-display tabular-nums">
                {formatPrice(item.productPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between border-t border-line-soft pt-3 mt-1">
          <span className="font-display font-medium text-lg">Итого</span>
          <span className="font-display text-xl tabular-nums">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionHeader}>Детали</h2>
        <div className="flex flex-col gap-2 pt-1 text-sm">
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
      <span className="font-sans text-xs text-mute">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
