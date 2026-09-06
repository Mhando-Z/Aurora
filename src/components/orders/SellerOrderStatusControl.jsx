"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const transitions = {
  pending: ["confirmed"],
  confirmed: ["processing"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export default function SellerOrderStatusControl({
  sellerOrderId,
  currentStatus,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const next = transitions[currentStatus]?.[0];

  if (!next) return null;

  async function advance() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/seller/orders/${sellerOrderId}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: next,
          }),
        },
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Status update failed");

      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const label = {
    confirmed: "Confirm order",
    processing: "Start processing",
    shipped: "Mark shipped",
    delivered: "Mark delivered",
  }[next];

  return (
    <div>
      <button
        type="button"
        onClick={advance}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {label}
      </button>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
