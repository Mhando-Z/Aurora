import Image from "next/image";
import Link from "next/link";

function money(value, currency = "TZS") {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function ProductCard({ product }) {
  const images = [...(product.images ?? [])].sort(
    (a, b) =>
      Number(b.is_primary) - Number(a.is_primary) ||
      a.sort_order - b.sort_order,
  );
  const image = images[0];

  return (
    <Link
      href={`/products/${product.id}`}
      className="group overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-square bg-black/[0.04]">
        {image ? (
          <Image
            src={image.image_url}
            alt={image.alt_text || product.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-black/40">
            No image
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-semibold">{product.title}</h3>
          <span className="whitespace-nowrap text-xs font-medium uppercase text-black/50">
            {product.condition}
          </span>
        </div>
        <p className="mt-3 text-lg font-bold">
          {money(product.price, product.currency)}
        </p>
        <p className="mt-1 text-xs text-black/50">
          {product.quantity > 0
            ? `${product.quantity} in stock`
            : "Out of stock"}
        </p>
      </div>
    </Link>
  );
}
