import { NextResponse } from "next/server";
import { getOnlinePaymentProvider } from "@/lib/payments";
import { processVerifiedPaymentEvent } from "@/lib/payments/processVerifiedEvent";

async function handle(request, { params }) {
  const { provider: routeProvider } = await params;
  const provider = getOnlinePaymentProvider();

  if (!provider.configured || provider.key !== routeProvider) {
    return NextResponse.json({ error: "Unknown payment provider" }, { status: 404 });
  }

  try {
    const event = await provider.verifyWebhook({
      request,
      url: new URL(request.url),
    });

    const processed = await processVerifiedPaymentEvent(provider.key, event);

    if (request.method === "GET" && provider.key === "mock") {
      const orderId = processed.orderId || new URL(request.url).searchParams.get("order_id");
      if (orderId) {
        return NextResponse.redirect(new URL(`/orders/${orderId}`, request.url));
      }
    }

    return NextResponse.json({
      success: true,
      duplicate: processed.duplicate,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Webhook verification failed" },
      { status: 400 },
    );
  }
}

export const GET = handle;
export const POST = handle;
