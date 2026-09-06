import { mockProvider } from "./providers/mock";
import { unconfiguredProvider } from "./providers/unconfigured";

export function getOnlinePaymentProvider() {
  const configured = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();

  if (
    configured === "mock" &&
    process.env.NODE_ENV !== "production"
  ) {
    return mockProvider;
  }

  return unconfiguredProvider;
}

export function getAvailablePaymentMethods() {
  const provider = getOnlinePaymentProvider();

  return {
    cashOnDelivery: true,
    online: provider.configured === true,
    onlineProvider: provider.publicName,
  };
}
