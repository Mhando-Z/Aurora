// import { createClient } from "../supabase/server";

// export async function getCurrentUser() {
//   const supabase = await createClient();

//   const { data: claimsData, error: claimsError } =
//     await supabase.auth.getClaims();

//   if (claimsError) {
//     console.error("Claims loading error:", claimsError);
//     return null;
//   }

//   const claims = claimsData?.claims;

//   if (!claims?.sub) {
//     return null;
//   }

//   const userId = claims.sub;

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
//       .maybeSingle(),

//     supabase.from("user_roles").select("role").eq("user_id", userId),
//   ]);

//   if (profileError) {
//     console.error("Profile loading error:", profileError);
//   }

//   if (rolesError) {
//     console.error("Roles loading error:", rolesError);
//   }

//   return {
//     id: userId,

//     email: claims.email ?? null,

//     fullName: profile?.full_name ?? null,

//     phone: profile?.phone ?? null,

//     avatarUrl: profile?.avatar_url ?? null,

//     onboardingCompletedAt: profile?.onboarding_completed_at ?? null,

//     createdAt: profile?.created_at ?? null,

//     roles: roles?.map(({ role }) => role) ?? ["customer"],
//   };
// }
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserData() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // Logged-out visitor is normal
    if (userError || !user) {
      return {
        user: null,
        profile: null,
        roles: [],
      };
    }

    // Fetch profile and roles at the same time
    const [profileResult, rolesResult] = await Promise.all([
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
        .eq("id", user.id)
        .maybeSingle(),

      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);

    if (profileResult.error) {
      console.error("Server profile error:", profileResult.error);
    }

    if (rolesResult.error) {
      console.error("Server roles error:", rolesResult.error);
    }

    return {
      user,

      profile: profileResult.data ?? null,

      roles: rolesResult.data?.map((item) => item.role) ?? [],
    };
  } catch (error) {
    console.error("getCurrentUserData error:", error);

    return {
      user: null,
      profile: null,
      roles: [],
    };
  }
}
