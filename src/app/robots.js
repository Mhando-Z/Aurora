export default function robots() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://auroraspareparts.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",

        disallow: [
          "/dashboard/",
          "/account/",
          "/admin/",
          "/checkout/",
          "/cart/",
          "/api/",
        ],
      },
    ],

    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
