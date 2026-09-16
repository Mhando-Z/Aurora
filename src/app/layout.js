// import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";

// import Navbar from "@/components/Navbar";

// import { UserProvider } from "@/context/UserContext";
// import { DataProvider } from "@/context/DataContext";

// import { createClient } from "@/lib/supabase/server";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata = {
//   title: "Aurora Spare Parts",

//   description:
//     "Aurora Marketplace is a digital marketplace for motorcycle spare parts, designed to connect suppliers, retailers, mechanics, riders, and other participants in the motorcycle aftermarket ecosystem.",

//   icons: {
//     icon: "/Aurora logo.png",
//   },
// };

// export default async function RootLayout({ children }) {
//   const supabase = await createClient();

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   return (
//     <html
//       lang="en"
//       className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
//     >
//       <body className="min-h-full flex flex-col">
//         <UserProvider initialUser={user}>
//           <DataProvider>
//             <Navbar />

//             {children}
//           </DataProvider>
//         </UserProvider>
//       </body>
//     </html>
//   );
// }
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import Navbar from "@/components/Navbar";
import AuthSync from "@/components/AuthSync";

import { UserProvider } from "@/context/UserContext";

import { DataProvider } from "@/context/DataContext";

import { getCurrentUserData } from "@/lib/auth/getCurrentUserData";

export const metadata = {
  title: "Aurora Spare Parts",

  description:
    "Aurora Marketplace is a digital marketplace for motorcycle spare parts, designed to connect suppliers, retailers, mechanics, riders, and other participants in the motorcycle aftermarket ecosystem.",

  icons: {
    icon: "/Aurora logo.png",
  },
};

export default async function RootLayout({ children }) {
  /*
   * All authenticated user information
   * is loaded ON THE SERVER.
   */
  const userData = await getCurrentUserData();

  const { user, profile, roles } = userData;

  return (
    <html lang="en" className={`h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/*
          Watches browser authentication changes.
          When login/logout happens it causes
          RootLayout to run again on the server.
        */}
        <AuthSync serverUserId={user?.id ?? null} />

        <UserProvider initialData={userData}>
          <DataProvider>
            {/*
              Navbar receives server data DIRECTLY.

              It no longer needs to wait for
              UserContext to query Supabase.
            */}
            <Navbar user={user} profile={profile} roles={roles} />

            {children}
          </DataProvider>
        </UserProvider>
      </body>
    </html>
  );
}
