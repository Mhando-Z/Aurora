"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { useData } from "@/context/DataContext";

function money(value, currency = "TZS") {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function CartClient() {
  const {
    cart,
    cartItems,
    cartCount,
    cartLoading,
    cartBusyId,
    cartError,
    hasUnavailableItems,
    updateCartItem,
    removeCartItem,
  } = useData();

  // =========================================================
  // UPDATE QUANTITY
  // =========================================================

  async function updateQuantity(item, nextQuantity) {
    if (nextQuantity < 1) return;

    if (nextQuantity > item.listing.quantity) {
      return;
    }

    await updateCartItem(item.id, nextQuantity);
  }

  // =========================================================
  // REMOVE ITEM
  // =========================================================

  async function removeItem(itemId) {
    await removeCartItem(itemId);
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (cartLoading && !cart) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-black/60" />

          <p className="text-sm text-black/50">Loading your cart...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // EMPTY CART
  // =========================================================

  if (!cartItems?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-black/15 bg-white p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.04]">
          <ShoppingBag className="h-7 w-7 text-black/35" />
        </div>

        <h2 className="mt-5 text-xl font-semibold">Your cart is empty</h2>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-black/55">
          Add spare parts from the marketplace and they will appear here.
        </p>

        <Link
          href="/products"
          className="mt-6 inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/85"
        >
          Browse products
        </Link>
      </div>
    );
  }

  // =========================================================
  // CART
  // =========================================================

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* =====================================================
          CART ITEMS
      ====================================================== */}

      <section className="min-w-0 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Shopping cart</h1>

            <p className="mt-1 text-sm text-black/50">
              {cartCount} {cartCount === 1 ? "item" : "items"} in your cart
            </p>
          </div>
        </div>

        {cartItems.map((item) => {
          const image = item.listing?.primaryImage;
          const itemBusy = cartBusyId === item.id;

          const unavailable = item.listing?.status !== "published";

          const quantityUnavailable = item.quantity > item.listing?.quantity;

          return (
            <article
              key={item.id}
              className="relative grid grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-3xl border border-black/10 bg-white p-4 transition sm:grid-cols-[110px_minmax(0,1fr)] md:grid-cols-[120px_minmax(0,1fr)_auto]"
            >
              {/* PRODUCT IMAGE */}

              <div className="relative aspect-square overflow-hidden rounded-2xl bg-black/[0.04]">
                {image?.image_url ? (
                  <Image
                    src={image.image_url}
                    alt={image.alt_text || item.listing?.title || "Product"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 88px, 120px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-black/20" />
                  </div>
                )}

                {itemBusy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/65 backdrop-blur-[1px]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                )}
              </div>

              {/* PRODUCT INFORMATION */}

              <div className="min-w-0">
                <Link
                  href={`/products/${item.listing.id}`}
                  className="line-clamp-2 text-sm font-semibold transition hover:underline sm:text-base"
                >
                  {item.listing.title}
                </Link>

                {item.listing.condition && (
                  <p className="mt-1 text-xs capitalize text-black/50 sm:text-sm">
                    {item.listing.condition}
                  </p>
                )}

                <p className="mt-2 font-semibold sm:mt-3">
                  {money(item.listing.price, item.listing.currency)}
                </p>

                {/* AVAILABILITY WARNINGS */}

                {unavailable ? (
                  <div className="mt-2 flex items-start gap-1.5 text-xs font-medium text-red-600">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                    <span>This product is no longer available.</span>
                  </div>
                ) : quantityUnavailable ? (
                  <div className="mt-2 flex items-start gap-1.5 text-xs font-medium text-red-600">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                    <span>
                      Only {item.listing.quantity} currently available.
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-xs font-medium text-black/40">
                    {item.listing.quantity} available
                  </p>
                )}

                {/* QUANTITY CONTROLS */}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-xl border border-black/10">
                    <button
                      type="button"
                      disabled={itemBusy || item.quantity <= 1}
                      onClick={() => updateQuantity(item, item.quantity - 1)}
                      className="grid h-9 w-9 place-items-center rounded-l-xl transition hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <span className="min-w-9 text-center text-sm font-semibold">
                      {itemBusy ? (
                        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                      ) : (
                        item.quantity
                      )}
                    </span>

                    <button
                      type="button"
                      disabled={
                        itemBusy ||
                        item.quantity >= item.listing.quantity ||
                        unavailable
                      }
                      onClick={() => updateQuantity(item, item.quantity + 1)}
                      className="grid h-9 w-9 place-items-center rounded-r-xl transition hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={itemBusy}
                    onClick={() => removeItem(item.id)}
                    className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Remove ${item.listing.title}`}
                  >
                    <Trash2 className="h-4 w-4" />

                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>

              {/* ITEM TOTAL */}

              <div className="col-span-2 flex items-center justify-between border-t border-black/[0.06] pt-3 md:col-span-1 md:block md:border-0 md:pt-0 md:text-right">
                <p className="text-xs uppercase tracking-wider text-black/40">
                  Total
                </p>

                <p className="font-bold md:mt-1">
                  {money(
                    Number(item.listing.price) * Number(item.quantity),
                    item.listing.currency,
                  )}
                </p>
              </div>
            </article>
          );
        })}

        {/* ===================================================
            ERROR
        ==================================================== */}

        {cartError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{cartError}</span>
          </div>
        )}
      </section>

      {/* =====================================================
          ORDER SUMMARY
      ====================================================== */}

      <aside className="h-fit rounded-3xl border border-black/10 bg-white p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Order summary</h2>

        <div className="mt-5 space-y-3">
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-black/55">Items</span>

            <span className="font-medium">{cartCount}</span>
          </div>

          <div className="flex justify-between gap-4 text-sm">
            <span className="text-black/55">Subtotal</span>

            <span className="font-semibold">
              {money(cart?.subtotal, cart?.currency)}
            </span>
          </div>

          <div className="flex justify-between gap-4 text-sm">
            <span className="text-black/55">Delivery</span>

            <span className="text-right text-black/70">
              Calculated at checkout
            </span>
          </div>
        </div>

        <div className="my-5 h-px bg-black/10" />

        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold">Estimated total</span>

          <span className="text-lg font-bold">
            {money(cart?.subtotal, cart?.currency)}
          </span>
        </div>

        {/* CHECKOUT */}

        {hasUnavailableItems ? (
          <div className="mt-5 rounded-2xl bg-red-50 p-3">
            <div className="flex items-start gap-2 text-xs font-medium text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <p>
                Resolve unavailable products or quantities before continuing to
                checkout.
              </p>
            </div>
          </div>
        ) : (
          <Link
            href="/checkout"
            className="mt-5 flex w-full items-center justify-center rounded-2xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-black/85"
          >
            Checkout
          </Link>
        )}

        <Link
          href="/products"
          className="mt-3 flex w-full items-center justify-center rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black/65 transition hover:bg-black/3 hover:text-black"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
