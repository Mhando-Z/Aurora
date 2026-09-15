"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthSync({ serverUserId = null }) {
  const router = useRouter();

  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const browserUserId = session?.user?.id ?? null;

      /*
       * Browser auth and server auth disagree.
       *
       * Refresh Server Components so RootLayout
       * receives the latest cookies and reloads:
       *
       * - user
       * - profile
       * - roles
       * - navbar
       */
      if (event === "INITIAL_SESSION") {
        if (browserUserId !== serverUserId) {
          router.refresh();
        }

        return;
      }

      /*
       * LOGIN
       */
      if (event === "SIGNED_IN") {
        if (browserUserId !== serverUserId) {
          router.refresh();
        }

        return;
      }

      /*
       * LOGOUT
       */
      if (event === "SIGNED_OUT") {
        if (serverUserId !== null) {
          router.refresh();
        }

        return;
      }

      /*
       * User metadata changed
       */
      if (event === "USER_UPDATED") {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, serverUserId]);

  return null;
}
