export const mockProvider = {
  key: "mock",
  publicName: "Development test payment",
  configured: true,

  async initialize({ order, payment, origin }) {
    // Development only. The caller can immediately mark this payment paid
    // through the returned local confirmation URL.
    return {
      providerPaymentId: `mock_${payment.id}`,
      providerReference: order.order_number,
      checkoutUrl: `${origin}/api/payments/webhook/mock?payment_id=${payment.id}&order_id=${order.id}`,
      status: "requires_action",
      metadata: {
        development_only: true,
      },
    };
  },

  async verifyWebhook({ request, url }) {
    if (request.method !== "GET") {
      throw new Error("Mock provider only accepts GET");
    }

    const paymentId = url.searchParams.get("payment_id");
    if (!paymentId) {
      throw new Error("Missing payment_id");
    }

    return {
      eventId: `mock-paid-${paymentId}`,
      eventType: "payment.paid",
      paymentId,
      providerPaymentId: `mock_${paymentId}`,
      providerReference: paymentId,
      status: "paid",
      metadata: {
        development_only: true,
      },
    };
  },
};
