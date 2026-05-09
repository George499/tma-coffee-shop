import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { QueryProvider } from '@/components/QueryProvider';
import { TelegramInit } from '@/components/TelegramInit';
import './globals.css';

const display = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-display-loaded',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const mono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mono-loaded',
  display: 'swap',
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'COFFEE SHOP',
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
    <html
      lang="en"
      className={`${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <TelegramInit />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
