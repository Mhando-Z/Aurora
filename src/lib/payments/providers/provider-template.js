/**
 * Copy this to the provider Aurora selects (for example your chosen Tanzanian
 * gateway) and implement the provider's CURRENT API and signature rules.
 */
export const providerTemplate = {
  key: "replace-me",
  publicName: "Replace with provider name",
  configured: false,

  async initialize({ order, payment, user, origin }) {
    void order;
    void payment;
    void user;
    void origin;
    throw new Error("Provider adapter not implemented");
  },

  async verifyWebhook({ request }) {
    void request;
    // Verify signature/token BEFORE returning an event.
    throw new Error("Provider webhook verification not implemented");
  },
};
