"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import { createClient } from "@/lib/supabase/client";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);

      // Get currently authenticated Supabase user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setUser(null);
        setProfile(null);
        setRoles([]);
        return;
      }

      setUser(user);

      // Get profile
      const { data: profileData, error: profileError } = await supabase
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
        .maybeSingle();

      if (profileError) {
        console.error("Profile error:", profileError);
      }

      setProfile(profileData ?? null);

      // Get roles
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (roleError) {
        console.error("Roles error:", roleError);
      }

      setRoles(roleData?.map((item) => item.role) ?? []);
    } catch (error) {
      console.error("UserContext error:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, loadUser]);

  const value = {
    user,

    profile,

    roles,

    loading,

    refreshUser: loadUser,

    // Convenient combined values
    id: user?.id ?? null,
    email: user?.email ?? null,

    fullName:
      profile?.full_name ??
      user?.user_metadata?.full_name ??
      user?.user_metadata?.name ??
      null,

    phone: profile?.phone ?? null,

    avatarUrl:
      profile?.avatar_url ??
      user?.user_metadata?.avatar_url ??
      user?.user_metadata?.picture ??
      null,

    onboardingCompletedAt: profile?.onboarding_completed_at ?? null,

    hasRole: (role) => roles.includes(role),
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used inside UserProvider");
  }

  return context;
}
