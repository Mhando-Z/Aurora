import { redirect } from "next/navigation";
import { logout } from "../(auth)/actions";
import { createClient } from "@/lib/supabase/server";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login?next=/account");
  }

  const [
    { data: profile, error: profileError },
    { data: roles, error: rolesError },
    { data: addresses, error: addressesError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        `
        id,
        full_name,
        phone,
        avatar_url,
        onboarding_completed_at,
        created_at
      `,
      )
      .eq("id", userId)
      .single(),

    supabase.from("user_roles").select("role").eq("user_id", userId),

    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (profileError) {
    console.error("Profile loading error:", profileError);
  }

  if (rolesError) {
    console.error("Roles loading error:", rolesError);
  }

  if (addressesError) {
    console.error("Addresses loading error:", addressesError);
  }

  return (
    <AccountClient
      userId={userId}
      email={claimsData?.claims?.email || ""}
      initialProfile={profile}
      initialRoles={roles || []}
      initialAddresses={addresses || []}
      logoutAction={logout}
    />
  );
}
