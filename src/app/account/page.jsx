// import { redirect } from "next/navigation";
// import { logout } from "../(auth)/actions";
// import { createClient } from "@/lib/supabase/server";

// export default async function AccountPage() {
//   const supabase = await createClient();

//   const { data: claimsData, error: claimsError } =
//     await supabase.auth.getClaims();

//   const userId = claimsData?.claims?.sub;

//   if (claimsError || !userId) {
//     redirect("/login?next=/account");
//   }

//   const [
//     { data: profile, error: profileError },
//     { data: roles, error: rolesError },
//   ] = await Promise.all([
//     supabase
//       .from("profiles")
//       .select(
//         `
//           id,
//           full_name,
//           phone,
//           avatar_url,
//           onboarding_completed_at,
//           created_at
//         `,
//       )
//       .eq("id", userId)
//       .single(),

//     supabase.from("user_roles").select("role").eq("user_id", userId),
//   ]);

//   if (profileError) {
//     console.error("Profile loading error:", profileError);
//   }

//   if (rolesError) {
//     console.error("Roles loading error:", rolesError);
//   }

//   return (
//     <main className="mx-auto max-w-3xl px-6 py-12">
//       <div className="space-y-8">
//         <div>
//           <h1 className="text-3xl font-bold">My account</h1>

//           <p className="mt-1 text-gray-600">Manage your Aurora account.</p>
//         </div>

//         <section className="rounded-xl border p-6">
//           <h2 className="mb-4 text-xl font-semibold">Profile</h2>

//           <dl className="space-y-3">
//             <div>
//               <dt className="text-sm text-gray-500">Name</dt>

//               <dd>{profile?.full_name || "Not provided"}</dd>
//             </div>

//             <div>
//               <dt className="text-sm text-gray-500">Email</dt>

//               <dd>{claimsData?.claims?.email || "Unavailable"}</dd>
//             </div>

//             <div>
//               <dt className="text-sm text-gray-500">Phone</dt>

//               <dd>{profile?.phone || "Not provided"}</dd>
//             </div>

//             <div>
//               <dt className="text-sm text-gray-500">Role</dt>

//               <dd>{roles?.map(({ role }) => role).join(", ") || "customer"}</dd>
//             </div>
//           </dl>
//         </section>

//         <form action={logout}>
//           <button type="submit" className="rounded-lg border px-4 py-2">
//             Sign out
//           </button>
//         </form>
//       </div>
//     </main>
//   );
// }
"use client";

import { useUser } from "@/context/UserContext";
import { logout } from "../(auth)/actions";

export default function AccountPage() {
  const { fullName, email, phone, roles, loading } = useUser();

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">Loading account...</main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">My account</h1>

          <p className="mt-1 text-gray-600">Manage your Aurora account.</p>
        </div>

        <section className="rounded-xl border p-6">
          <h2 className="mb-4 text-xl font-semibold">Profile</h2>

          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Name</dt>

              <dd>{fullName || "Not provided"}</dd>
            </div>

            <div>
              <dt className="text-sm text-gray-500">Email</dt>

              <dd>{email || "Unavailable"}</dd>
            </div>

            <div>
              <dt className="text-sm text-gray-500">Phone</dt>

              <dd>{phone || "Not provided"}</dd>
            </div>

            <div>
              <dt className="text-sm text-gray-500">Role</dt>

              <dd>{roles.length > 0 ? roles.join(", ") : "customer"}</dd>
            </div>
          </dl>
        </section>

        <form action={logout}>
          <button type="submit" className="rounded-lg border px-4 py-2">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
