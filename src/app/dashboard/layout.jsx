import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../(auth)/actions";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();

  // Authenticate user
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login?next=/account");
  }

  // Retrieve dashboard information
  const [
    { data: profile, error: profileError },
    { data: roles, error: rolesError },
    { count: addressCount, error: addressError },
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
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("user_id", userId),
  ]);

  if (profileError) {
    console.error("Dashboard profile error:", profileError);
  }

  if (rolesError) {
    console.error("Dashboard roles error:", rolesError);
  }

  if (addressError) {
    console.error("Dashboard address error:", addressError);
  }

  const user = {
    id: userId,
    email: claimsData?.claims?.email || "",
    fullName: profile?.full_name || "",
    phone: profile?.phone || "",
    avatarUrl: profile?.avatar_url || null,
    roles: roles || [],
    addressCount: addressCount || 0,
    onboardingCompleted: Boolean(profile?.onboarding_completed_at),
  };

  return (
    <DashboardShell user={user} logoutAction={logout}>
      {children}
    </DashboardShell>
  );
}
