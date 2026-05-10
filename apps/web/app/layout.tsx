import type { Metadata, Viewport } from 'next';
import { Lora, DM_Sans } from 'next/font/google';
import { QueryProvider } from '@/components/QueryProvider';
import { TelegramInit } from '@/components/TelegramInit';
import './globals.css';

const display = Lora({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-display-loaded',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans-loaded',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

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
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bone text-ink">
        <TelegramInit />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
