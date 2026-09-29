import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../(auth)/actions";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();

  // 1. Verify authentication
  const { data, error } = await supabase.auth.getClaims();

  const claims = data?.claims;
  const userId = claims?.sub;

  if (error || !userId) {
    redirect("/login?next=/account");
  }

  // 2. Fetch only essential dashboard information
  const [profileResult, rolesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", userId)
      .maybeSingle(),

    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  // 3. Log unexpected database errors
  if (profileResult.error) {
    console.error("Dashboard profile error:", profileResult.error);
  }

  if (rolesResult.error) {
    console.error("Dashboard roles error:", rolesResult.error);
  }

  // 4. Construct minimal user object
  const user = {
    id: userId,
    email: claims.email || "",
    fullName: profileResult.data?.full_name || "",
    avatarUrl: profileResult.data?.avatar_url || null,
    roles: rolesResult.data?.map(({ role }) => role) || [],
  };

  // 5. Render dashboard
  return (
    <DashboardShell user={user} logoutAction={logout}>
      {children}
    </DashboardShell>
  );
}
