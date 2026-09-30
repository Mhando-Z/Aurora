"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { PackageX, Tag, ArrowUpRight } from "lucide-react";

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
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0),
    );

    return sorted[0];
  }, [product.images]);

  const quantity = Number(product.quantity ?? 0);
  const inStock = quantity > 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 24,
      }}
      className="h-full"
    >
      <Link
        href={`/products/${product.id}`}
        aria-label={`View ${product.title}`}
        className="
          group relative flex h-full flex-col overflow-hidden
          rounded-xl border border-black/10 bg-white
          shadow-[0_1px_2px_rgba(0,0,0,0.04)]
          transition-all duration-300
          hover:border-black/20
          hover:shadow-[0_14px_35px_rgba(0,0,0,0.08)]
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-black
          focus-visible:ring-offset-2
        "
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-black/3">
          {image ? (
            <Image
              src={image.image_url}
              alt={image.alt_text || product.title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="
                object-cover
                transition-transform
                duration-500
                ease-out
                group-hover:scale-[1.04]
              "
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-black/40">
              No image available
            </div>
          )}

          {/* subtle image overlay */}
          <div
            className="
              pointer-events-none absolute inset-0
              bg-linear-to-t
              from-black/4
              via-transparent
              to-transparent
            "
          />

          {/* Condition badge */}
          {product.condition && (
            <div className="absolute left-3 top-3 md:hidden">
              <span
                className="
                  inline-flex items-center gap-1.5
                  rounded-full border border-black/10
                  bg-white/90 px-2.5 py-1.5
                  text-[10px] font-medium uppercase
                  tracking-wide text-black/60
                  shadow-sm backdrop-blur-md
                "
              >
                <Tag className="h-3 w-3" />
                {product.condition}
              </span>
            </div>
          )}

          {/* Desktop hover action */}
          <div
            className="
              absolute right-3 top-3 hidden
              translate-y-1 opacity-0
              transition-all duration-300
              group-hover:translate-y-0
              group-hover:opacity-100
              md:block
            "
          >
            <span
              className="
                flex h-9 w-9 items-center justify-center
                rounded-full border border-black/10
                bg-white/90 shadow-sm backdrop-blur-md
              "
            >
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>

          {/* Out of stock */}
          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/65 backdrop-blur-[2px]">
              <span
                className="
                  inline-flex items-center gap-2
                  rounded-full bg-black
                  px-3.5 py-2
                  text-xs font-medium text-white
                  shadow-sm
                "
              >
                <PackageX className="h-3.5 w-3.5" />
                Out of stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
          {/* Desktop title + condition */}
          <div className="hidden items-start justify-between gap-4 md:flex">
            <h3
              className="
                line-clamp-2
                min-w-0 flex-1
                text-base font-semibold
                leading-5
                text-black
              "
            >
              {product.title}
            </h3>
          </div>

          {/* Mobile title */}
          <h3
            className="
              line-clamp-2
              text-sm font-semibold
              leading-5
              text-black
              md:hidden
            "
          >
            {product.title}
          </h3>

          {/* Bottom info */}
          <div className="mt-auto flex items-start justify-between gap-2 pt-4">
            <div>
              <p
                className="
                text-base font-bold
                tracking-[-0.01em]
                text-black
                sm:text-lg
              "
              >
                {money(product.price, product.currency)}
              </p>

              <div className="mt-1.5 flex items-center justify-between gap-3">
                <p
                  className={`text-xs ${
                    inStock ? "text-black/45" : "font-medium text-black/70"
                  }`}
                >
                  {inStock
                    ? quantity === 1
                      ? "1 item in stock"
                      : `${quantity} items in stock`
                    : "Currently unavailable"}
                </p>

                {/* Mobile visual hint */}
                <ArrowUpRight
                  className="
                  h-4 w-4
                  shrink-0 text-black/30
                  transition-all duration-300
                  group-hover:-translate-y-0.5
                  group-hover:translate-x-0.5
                  group-hover:text-black
                  md:hidden
                "
                />
              </div>
            </div>
            {product.condition && (
              <span
                className="
                  md:flex hidden shrink-0 py-2 items-center gap-1
                  whitespace-nowrap
                  text-[10px] font-medium
                  uppercase tracking-wide
                  text-black/45
                "
              >
                <Tag className="h-3 w-3" />
                {product.condition}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
