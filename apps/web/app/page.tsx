import { Catalog } from '@/components/Catalog';
import { CartBar } from '@/components/CartBar';

export default function Home() {
  return (
    <>
      <main className="flex-1 max-w-4xl w-full mx-auto pb-32">
        <header className="px-5 pt-6 pb-5 border-b-2 border-ink">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-mute">
            est. 2026 · самовывоз и доставка
          </p>
          <h1 className="mt-2 font-display font-bold text-[clamp(2.5rem,9vw,4.5rem)] leading-[0.95] tracking-tight uppercase">
            Coffee
            <br />
            <span className="text-accent">Shop</span>
          </h1>
          <p className="mt-3 text-sm text-mute max-w-md">
            Свежесваренный кофе и выпечка. Выбирайте, оформляйте — забирайте за
            пятнадцать минут.
          </p>
        </header>
        <Catalog />
      </main>
      <CartBar />
    </>
  );
}
