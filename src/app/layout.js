// import { Geist, Geist_Mono } from "next/font/google";

// import "./globals.css";

// import Navbar from "@/components/Navbar";
// import AuthSync from "@/components/AuthSync";

// import { UserProvider } from "@/context/UserContext";

// import { DataProvider } from "@/context/DataContext";

// import { getCurrentUserData } from "@/lib/auth/getCurrentUserData";

// export const metadata = {
//   title: "Aurora Spare Parts",

//   description:
//     "Aurora Marketplace is a digital marketplace for motorcycle spare parts, designed to connect suppliers, retailers, mechanics, riders, and other participants in the motorcycle aftermarket ecosystem.",

//   icons: {
//     icon: "/Aurora logo.png",
//   },
// };

// export default async function RootLayout({ children }) {
//   /*
//    * All authenticated user information
//    * is loaded ON THE SERVER.
//    */
//   const userData = await getCurrentUserData();

//   const { user, profile, roles } = userData;

//   return (
//     <html lang="en" className={`h-full antialiased`}>
//       <body className="min-h-full flex flex-col">
//         {/*
//           Watches browser authentication changes.
//           When login/logout happens it causes
//           RootLayout to run again on the server.
//         */}
//         <AuthSync serverUserId={user?.id ?? null} />

//         <UserProvider initialData={userData}>
//           <DataProvider>
//             {/*
//               Navbar receives server data DIRECTLY.

//               It no longer needs to wait for
//               UserContext to query Supabase.
//             */}
//             <Navbar user={user} profile={profile} roles={roles} />

//             {children}
//           </DataProvider>
//         </UserProvider>
//       </body>
//     </html>
//   );
// }
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import Navbar from "@/components/Navbar";
import AuthSync from "@/components/AuthSync";

import { UserProvider } from "@/context/UserContext";
import { DataProvider } from "@/context/DataContext";

import { getCurrentUserData } from "@/lib/auth/getCurrentUserData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://auroraspareparts.vercel.app/";

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Aurora Spare Parts | Motorcycle Spare Parts Marketplace",
    template: "%s | Aurora Spare Parts",
  },

  description:
    "Aurora Spare Parts is a motorcycle spare parts marketplace connecting riders, mechanics, retailers, suppliers and businesses with motorcycle parts and accessories.",

  applicationName: "Aurora Spare Parts",

  keywords: [
    "Aurora Spare Parts",
    "motorcycle spare parts",
    "motorcycle parts",
    "motorbike spare parts",
    "motorcycle accessories",
    "motorcycle parts marketplace",
    "motorcycle parts Tanzania",
    "motorbike parts Tanzania",
    "spare parts Tanzania",
    "motorcycle suppliers Tanzania",
    "motorcycle retailers Tanzania",
    "motorcycle mechanics Tanzania",
  ],

  authors: [
    {
      name: "Aurora Spare Parts",
      url: SITE_URL,
    },
  ],

  creator: "Aurora Spare Parts",
  publisher: "Aurora Spare Parts",

  category: "ecommerce",

  referrer: "origin-when-cross-origin",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_TZ",

    url: "/",

    siteName: "Aurora Spare Parts",

    title: "Aurora Spare Parts | Motorcycle Spare Parts Marketplace",

    description:
      "Find motorcycle spare parts and accessories from suppliers and retailers through Aurora Spare Parts.",

    images: [
      {
        url: "https://gdagjlvlwmagvonhepsc.supabase.co/storage/v1/object/public/Assets/logos/Aurora%20logo.png",
        width: 1200,
        height: 630,
        alt: "Aurora Spare Parts Marketplace",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "Aurora Spare Parts | Motorcycle Spare Parts Marketplace",

    description:
      "Discover motorcycle spare parts, accessories, suppliers and retailers through Aurora Spare Parts.",

    images: [
      "https://gdagjlvlwmagvonhepsc.supabase.co/storage/v1/object/public/Assets/logos/Aurora%20logo.png",
    ],
  },

  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "https://gdagjlvlwmagvonhepsc.supabase.co/storage/v1/object/public/Assets/logos/Aurora%20logo.png",
        type: "image/png",
      },
    ],

    shortcut: "/favicon.ico",

    apple:
      "https://gdagjlvlwmagvonhepsc.supabase.co/storage/v1/object/public/Assets/logos/Aurora%20logo.png",
  },

  // manifest: "/manifest.webmanifest",

  other: {
    "format-detection": "telephone=no",
  },
};

export default async function RootLayout({ children }) {
  /*
   * Authentication data is loaded on the server.
   * This keeps the initial render consistent
   * and avoids unnecessary client-side auth queries.
   */
  const userData = await getCurrentUserData();

  const { user, profile, roles } = userData;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QH8K9BEMXX"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QH8K9BEMXX');
          `}
        </Script>

        <script
          id="organization-schema"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Aurora Spare Parts",
            url: "https://auroraspareparts.vercel.app",
            logo: "https://gdagjlvlwmagvonhepsc.supabase.co/storage/v1/object/public/Assets/logos/Aurora%20logo.png",
            description:
              "Aurora Spare Parts is a motorcycle spare parts marketplace connecting riders, mechanics, retailers, suppliers and businesses with motorcycle parts and accessories.",

            areaServed: {
              "@type": "Country",
              name: "Tanzania",
            },
            foundingLocation: {
              "@type": "Place",
              address: {
                "@type": "PostalAddress",
                addressCountry: "TZ",
              },
            },
          })}
        </script>
      </head>
      <body className="min-h-full flex flex-col">
        <AuthSync serverUserId={user?.id ?? null} />

        <UserProvider initialData={userData}>
          <DataProvider>
            <Navbar user={user} profile={profile} roles={roles} />

            <main className="flex-1">{children}</main>
          </DataProvider>
        </UserProvider>
      </body>
    </html>
  );
}
