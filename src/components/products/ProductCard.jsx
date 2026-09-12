"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { PackageX, Tag } from "lucide-react";

function money(value, currency = "TZS") {
  try {
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
}

export default function ProductCard({ product, priority = false }) {
  const image = useMemo(() => {
    const sorted = [...(product.images ?? [])].sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) ||
        a.sort_order - b.sort_order,
    );
    return sorted[0];
  }, [product.images]);

  const inStock = Number(product.quantity) > 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <Link
        href={`/products/${product.id}`}
        className="group block overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition hover:shadow-md"
      >
        <div className="relative aspect-square bg-black/[0.04]">
          {image ? (
            <Image
              src={image.image_url}
              alt={image.alt_text || product.title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-black/40">
              No image
            </div>
          )}

          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
              <span className="flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1 text-xs font-medium text-white">
                <PackageX className="h-3.5 w-3.5" />
                Out of stock
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 font-semibold">{product.title}</h3>
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium uppercase text-black/50">
              <Tag className="h-3 w-3" />
              {product.condition}
            </span>
          </div>
          <p className="mt-3 text-lg font-bold">
            {money(product.price, product.currency)}
          </p>
          <p
            className={`mt-1 text-xs ${
              inStock ? "text-black/50" : "font-medium text-black/70"
            }`}
          >
            {inStock ? `${product.quantity} in stock` : "Out of stock"}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
