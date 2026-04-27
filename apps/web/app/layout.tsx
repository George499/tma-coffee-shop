import type { Metadata, Viewport } from 'next';
import { QueryProvider } from '@/components/QueryProvider';
import { TelegramInit } from '@/components/TelegramInit';
import './globals.css';

export const metadata: Metadata = {
  title: 'Coffee Shop',
  description: 'Telegram Mini App: coffee shop catalog and cart.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-tg-bg text-tg-text">
        <TelegramInit />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
