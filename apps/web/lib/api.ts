import type { Category, Product, TelegramUser } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
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
};
