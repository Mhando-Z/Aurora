export const unconfiguredProvider = {
  key: "unconfigured",
  publicName: null,
  configured: false,

  async initialize() {
    throw new Error(
      "Online payment provider is not configured. Cash on delivery remains available.",
    );
  },

  async verifyWebhook() {
    throw new Error("Online payment provider is not configured.");
  },
};
