import type {
  Category,
  CreatedOrder,
  CreateOrderInput,
  Order,
  Product,
  TelegramUser,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (body.message) {
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message;
      }
    } catch {
      // Body wasn't JSON or had no helpful message; keep the status text.
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

/**
 * Returns the raw initData string from Telegram. `undefined` when the page is
 * not running inside a Mini App (e.g. plain browser dev), so callers can fall
 * back to a public endpoint or surface an "open in Telegram" message.
 */
async function getRawInitData(): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined;
  try {
    const sdk = await import('@telegram-apps/sdk-react');
    if (!sdk.isTMA()) return undefined;
    return sdk.retrieveRawInitData();
  } catch {
    return undefined;
  }
}

async function tmaFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const initData = await getRawInitData();
  if (!initData) {
    throw new Error('Telegram initData is unavailable; open this page from the bot.');
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `tma ${initData}`);
  return fetchJson<T>(path, { ...init, headers });
}

export const api = {
  categories: () => fetchJson<Category[]>('/api/categories'),
  products: () => fetchJson<Product[]>('/api/products'),
  me: () => tmaFetch<TelegramUser>('/api/me'),
  createOrder: (input: CreateOrderInput) =>
    tmaFetch<CreatedOrder>('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  getOrder: (id: string) =>
    tmaFetch<Order>(`/api/orders/${encodeURIComponent(id)}`),
};
