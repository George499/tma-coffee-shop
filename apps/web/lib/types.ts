export type Category = {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  createdAt: string;
};

export type Product = {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number; // kopecks
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
};

/** Telegram user shape returned from the @telegram-apps/init-data-node parser. */
export type TelegramUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  is_bot?: boolean;
  photo_url?: string;
  allows_write_to_pm?: boolean;
};
