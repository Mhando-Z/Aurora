import { createClient } from "../supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError) {
    console.error("Claims loading error:", claimsError);
    return null;
  }

  const claims = claimsData?.claims;

  if (!claims?.sub) {
    return null;
  }

  const userId = claims.sub;

  const [
    { data: profile, error: profileError },
    { data: roles, error: rolesError },
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
      .maybeSingle(),

    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  if (profileError) {
    console.error("Profile loading error:", profileError);
  }

  if (rolesError) {
    console.error("Roles loading error:", rolesError);
  }

  return {
    id: userId,

    email: claims.email ?? null,

    fullName: profile?.full_name ?? null,

    phone: profile?.phone ?? null,

    avatarUrl: profile?.avatar_url ?? null,

    onboardingCompletedAt: profile?.onboarding_completed_at ?? null,

    createdAt: profile?.created_at ?? null,

    roles: roles?.map(({ role }) => role) ?? ["customer"],
  };
}
