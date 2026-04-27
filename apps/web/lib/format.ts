const rubFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

/** Convert kopecks to a localized RUB string, e.g. 18000 -> "180 ₽". */
export function formatPrice(kopecks: number): string {
  return rubFormatter.format(Math.round(kopecks / 100));
}
