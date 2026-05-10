import { Catalog } from '@/components/Catalog';
import { CartBar } from '@/components/CartBar';

export default function Home() {
  return (
    <>
      <main className="flex-1 max-w-4xl w-full mx-auto pb-32">
        <header className="px-5 pt-7 pb-7">
          <p className="font-sans text-[11px] tracking-[0.2em] uppercase text-mute">
            est. 2026 · самовывоз и доставка
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.75rem,10vw,4.75rem)] leading-[0.95] tracking-tight text-ink">
            Coffee
            <span className="font-medium text-accent"> &amp; </span>
            co.
          </h1>
          <p className="mt-4 text-sm text-mute max-w-md leading-relaxed">
            Свежесваренный кофе, чай и выпечка. Выбирайте, оформляйте —
            забирайте за пятнадцать минут.
          </p>

          <a
            href="#catalog"
            className="mt-6 inline-flex items-center gap-2 bg-ink text-cream rounded-full pl-6 pr-5 py-3.5 font-sans font-medium text-sm active:scale-[0.98] transition-transform"
            style={{ boxShadow: '0 14px 32px -12px rgba(26, 22, 18, 0.55)' }}
          >
            Открыть меню
            <span aria-hidden="true" className="text-base leading-none">
              ↓
            </span>
          </a>

          <div className="mt-7 h-px bg-line" />
        </header>
        <div id="catalog" className="scroll-mt-4">
          <Catalog />
        </div>
      </main>
      <CartBar />
    </>
  );
}
