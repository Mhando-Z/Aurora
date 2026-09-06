"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

function money(value, currency = "TZS") {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function CartClient() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load cart");
      }

      setCart(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const hasUnavailableItems = useMemo(
    () =>
      cart?.items?.some(
        (item) =>
          item.listing.status !== "published" ||
          item.quantity > item.listing.quantity,
      ) || false,
    [cart],
  );

  async function updateQuantity(item, nextQuantity) {
    if (nextQuantity < 1 || nextQuantity > item.listing.quantity) return;

    setBusyId(item.id);
    setError("");

    try {
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItemId: item.id,
          quantity: nextQuantity,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update cart");

      await loadCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(itemId) {
    setBusyId(itemId);
    setError("");

    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId: itemId }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not remove item");

      await loadCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading && !cart) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="rounded-3xl border border-dashed border-black/15 bg-white p-12 text-center">
        <ShoppingBag className="mx-auto h-9 w-9 text-black/30" />
        <h2 className="mt-4 text-xl font-semibold">Your cart is empty</h2>
        <p className="mt-2 text-sm text-black/55">
          Add spare parts from the marketplace and they will appear here.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        {cart.items.map((item) => {
          const image = item.listing.primaryImage;
          const itemBusy = busyId === item.id;

          return (
            <article
              key={item.id}
              className="grid grid-cols-[96px_1fr] gap-4 rounded-3xl border border-black/10 bg-white p-4 md:grid-cols-[120px_1fr_auto]"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-black/[0.04]">
                {image?.image_url ? (
                  <Image
                    src={image.image_url}
                    alt={image.alt_text || item.listing.title}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                ) : null}
              </div>

              <div className="min-w-0">
                <Link
                  href={`/products/${item.listing.id}`}
                  className="font-semibold hover:underline"
                >
                  {item.listing.title}
                </Link>

                <p className="mt-1 text-sm capitalize text-black/55">
                  {item.listing.condition}
                </p>

                <p className="mt-3 font-semibold">
                  {money(item.listing.price, item.listing.currency)}
                </p>

                {item.listing.status !== "published" ? (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    This product is no longer available.
                  </p>
                ) : item.quantity > item.listing.quantity ? (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    Only {item.listing.quantity} currently available.
                  </p>
                ) : null}

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={itemBusy || item.quantity <= 1}
                    onClick={() => updateQuantity(item, item.quantity - 1)}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-black/10 disabled:opacity-35"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <span className="min-w-8 text-center text-sm font-semibold">
                    {itemBusy ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    ) : (
                      item.quantity
                    )}
                  </span>

                  <button
                    type="button"
                    disabled={
                      itemBusy || item.quantity >= item.listing.quantity
                    }
                    onClick={() => updateQuantity(item, item.quantity + 1)}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-black/10 disabled:opacity-35"
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    disabled={itemBusy}
                    onClick={() => removeItem(item.id)}
                    className="ml-2 grid h-9 w-9 place-items-center rounded-xl text-red-600 hover:bg-red-50"
                    aria-label={`Remove ${item.listing.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="col-span-2 text-right md:col-span-1">
                <p className="text-xs uppercase tracking-wider text-black/45">
                  Total
                </p>
                <p className="mt-1 font-bold">
                  {money(
                    Number(item.listing.price) * item.quantity,
                    item.listing.currency,
                  )}
                </p>
              </div>
            </article>
          );
        })}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <aside className="h-fit rounded-3xl border border-black/10 bg-white p-6 lg:sticky lg:top-6">
        <h2 className="text-lg font-semibold">Order summary</h2>

        <div className="mt-5 flex justify-between text-sm">
          <span className="text-black/55">Items</span>
          <span>{cart.itemCount}</span>
        </div>

        <div className="mt-3 flex justify-between text-sm">
          <span className="text-black/55">Subtotal</span>
          <span className="font-semibold">
            {money(cart.subtotal, cart.currency)}
          </span>
        </div>

        <div className="mt-3 flex justify-between text-sm">
          <span className="text-black/55">Delivery</span>
          <span>Calculated at checkout</span>
        </div>

        <div className="my-5 h-px bg-black/10" />

        <div className="flex justify-between">
          <span className="font-semibold">Estimated total</span>
          <span className="text-lg font-bold">
            {money(cart.subtotal, cart.currency)}
          </span>
        </div>

        {hasUnavailableItems ? (
          <p className="mt-4 text-xs text-red-600">
            Resolve unavailable quantities before checkout.
          </p>
        ) : (
          <Link
            href="/checkout"
            className="mt-5 flex w-full items-center justify-center rounded-2xl bg-black px-5 py-3.5 text-sm font-semibold text-white"
          >
            Checkout
          </Link>
        )}
      </aside>
    </div>
  );
}
