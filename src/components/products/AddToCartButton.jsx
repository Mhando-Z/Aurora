"use client";

import { useState } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AddToCartButton({
  listingId,
  availableQuantity = 1,
  className = "",
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function addToCart() {
    if (loading || availableQuantity <= 0) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          quantity: 1,
        }),
      });

      const result = await response.json();

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || "Could not add product to cart");
      }

      setMessage("Added to cart");
      router.refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={addToCart}
        disabled={loading || availableQuantity <= 0}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        {availableQuantity > 0 ? "Add to cart" : "Out of stock"}
      </button>

      {message ? (
        <p className="mt-2 text-center text-xs text-black/60">{message}</p>
      ) : null}
    </div>
  );
}
