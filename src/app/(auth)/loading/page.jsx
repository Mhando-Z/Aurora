// "use client";

// import { useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";

// export default function AuthRefreshPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   useEffect(() => {
//     const next = searchParams.get("next") || "/";

//     // Force Next.js to refresh server components
//     router.refresh();

//     // Navigate to the intended page after refresh
//     router.replace(next);
//   }, [router, searchParams]);

//   return null;
// }
import React from "react";

function page() {
  return <div>page</div>;
}

export default page;
