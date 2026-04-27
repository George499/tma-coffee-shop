import Image from 'next/image';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="bg-tg-section-bg rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="relative aspect-square bg-tg-secondary-bg">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            // Picsum redirects to a CDN that some networks proxy through CGN
            // ranges, which Next's image optimiser blocks as a private IP.
            // Skip the proxy until real product images replace placeholders.
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-tg-hint text-sm">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3 flex-1">
        <h3 className="text-tg-text font-semibold leading-tight">{product.name}</h3>
        {product.description && (
          <p className="text-tg-hint text-sm leading-snug line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="mt-auto pt-2">
          <span className="text-tg-text font-semibold">
            {formatPrice(product.price)}
          </span>
        </div>
      </div>
    </article>
  );
}
