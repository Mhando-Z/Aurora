"use client";

import { createContext, useContext, useMemo } from "react";

const UserContext = createContext(null);

export function UserProvider({ children, initialData }) {
  const user = initialData?.user ?? null;

  const profile = initialData?.profile ?? null;

  const roles = initialData?.roles ?? [];

  const value = useMemo(
    () => ({
      /*
       * Raw data
       */
      user,
      profile,
      roles,

      /*
       * Auth state
       */
      isAuthenticated: Boolean(user),

      loading: false,

      /*
       * Common values
       */

      id: user?.id ?? null,

      email: user?.email ?? null,

      fullName:
        profile?.full_name ??
        user?.user_metadata?.full_name ??
        user?.user_metadata?.name ??
        null,

      phone: profile?.phone ?? user?.phone ?? null,

      avatarUrl:
        profile?.avatar_url ??
        user?.user_metadata?.avatar_url ??
        user?.user_metadata?.picture ??
        null,

      onboardingCompletedAt: profile?.onboarding_completed_at ?? null,

      /*
       * Roles
       */

      hasRole: (role) => roles.includes(role),

      isAdmin: roles.includes("admin"),

      isSeller: roles.includes("seller"),

      isBuyer: roles.includes("buyer"),
    }),
    [user, profile, roles],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used inside UserProvider");
  }

  return context;
}
