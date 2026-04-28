import { Catalog } from '@/components/Catalog';
import { CartBar } from '@/components/CartBar';

export default function Home() {
  return (
    <>
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 py-4 pb-28 flex flex-col gap-4">
        <header className="flex flex-col gap-1 px-1">
          <h1 className="text-tg-text text-2xl font-semibold">Coffee Shop</h1>
          <p className="text-tg-hint text-sm">
            Pick your favourite drink or pastry.
          </p>
        </header>
        <Catalog />
      </main>
      <CartBar />
    </>
  );
}
