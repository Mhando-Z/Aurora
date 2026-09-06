"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

const initialAddress = {
  full_name: "",
  phone: "",
  region: "",
  district: "",
  address_line: "",
  landmark: "",
};

export default function CheckoutForm() {
  const router = useRouter();
  const [address, setAddress] = useState(initialAddress);
  const [customerNote, setCustomerNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [methods, setMethods] = useState({
    cashOnDelivery: true,
    online: false,
    onlineProvider: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/payments/methods")
      .then((response) => response.json())
      .then(setMethods)
      .catch(() => {});
  }, []);

  function update(field, value) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: address,
          customerNote,
          paymentMethod,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Checkout failed");

      if (result.requiresPaymentInitialization) {
        const paymentResponse = await fetch(
          `/api/payments/${result.orderId}/initialize`,
          { method: "POST" },
        );
        const paymentResult = await paymentResponse.json();

        if (!paymentResponse.ok) {
          router.push(`/orders/${result.orderId}`);
          return;
        }

        if (paymentResult.checkoutUrl) {
          window.location.assign(paymentResult.checkoutUrl);
          return;
        }
      }

      router.push(`/orders/${result.orderId}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-8 lg:grid-cols-[1fr_360px]"
    >
      <section className="space-y-6 rounded-3xl border border-black/10 bg-white p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-black/45">
            Delivery details
          </p>
          <h2 className="mt-2 text-2xl font-bold">Where should we deliver?</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Full name"
            value={address.full_name}
            onChange={(value) => update("full_name", value)}
            required
          />
          <Field
            label="Phone number"
            value={address.phone}
            onChange={(value) => update("phone", value)}
            required
          />
          <Field
            label="Region"
            value={address.region}
            onChange={(value) => update("region", value)}
            required
          />
          <Field
            label="District"
            value={address.district}
            onChange={(value) => update("district", value)}
            required
          />
        </div>

        <Field
          label="Address / street / area"
          value={address.address_line}
          onChange={(value) => update("address_line", value)}
          required
        />

        <Field
          label="Nearby landmark (optional)"
          value={address.landmark}
          onChange={(value) => update("landmark", value)}
        />

        <label className="block">
          <span className="text-sm font-medium">Order note (optional)</span>
          <textarea
            value={customerNote}
            onChange={(event) => setCustomerNote(event.target.value)}
            rows={4}
            maxLength={500}
            className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black/30"
            placeholder="Delivery instructions or other information for the sellers"
          />
        </label>
      </section>

      <aside className="h-fit rounded-3xl border border-black/10 bg-white p-6 lg:sticky lg:top-6">
        <h2 className="text-lg font-semibold">Payment</h2>

        {methods.cashOnDelivery ? (
          <PaymentOption
            checked={paymentMethod === "cash_on_delivery"}
            onChange={() => setPaymentMethod("cash_on_delivery")}
            title="Cash on delivery"
            description="Pay when your order is delivered."
          />
        ) : null}

        {methods.online ? (
          <PaymentOption
            checked={paymentMethod === "online"}
            onChange={() => setPaymentMethod("online")}
            title={methods.onlineProvider || "Online payment"}
            description="Complete payment through the secure payment provider."
          />
        ) : (
          <p className="mt-4 rounded-2xl bg-black/[0.035] p-4 text-xs leading-5 text-black/55">
            Online payment is hidden until a production payment provider is
            configured. Checkout remains fully functional with cash on delivery.
          </p>
        )}

        <div className="mt-6 flex gap-3 rounded-2xl bg-black/[0.035] p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-xs leading-5 text-black/60">
            Stock is committed atomically when you place the order. If an
            eligible order is cancelled, Aurora restores the stock automatically.
          </p>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Place order
        </button>
      </aside>
    </form>
  );
}

function Field({ label, value, onChange, required = false }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-black/30"
      />
    </label>
  );
}

function PaymentOption({ checked, onChange, title, description }) {
  return (
    <label className="mt-4 flex cursor-pointer gap-3 rounded-2xl border border-black/10 p-4">
      <input
        type="radio"
        name="payment"
        checked={checked}
        onChange={onChange}
        className="mt-1"
      />
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-black/55">
          {description}
        </span>
      </span>
    </label>
  );
}
