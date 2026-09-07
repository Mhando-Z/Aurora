"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function safeRedirect(value, fallback = "/account") {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return fallback;
  }

  return value;
}

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return siteUrl.replace(/\/$/, "");
}

export async function login(formData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") || "");

  const next = safeRedirect(formData.get("next"));

  if (!email || !password) {
    redirect(
      `/login?error=${encodeURIComponent("Email and password are required.")}`,
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent("Invalid email or password.")}`,
    );
  }

  revalidatePath("/", "layout");

  redirect(next);
}

export async function register(formData) {
  const fullName = String(formData.get("fullName") || "").trim();

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") || "");

  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!fullName || !email || !password) {
    redirect(
      `/register?error=${encodeURIComponent(
        "Please complete all required fields.",
      )}`,
    );
  }

  if (password.length < 8) {
    redirect(
      `/register?error=${encodeURIComponent(
        "Password must contain at least 8 characters.",
      )}`,
    );
  }

  if (password !== confirmPassword) {
    redirect(
      `/register?error=${encodeURIComponent("Passwords do not match.")}`,
    );
  }

  const supabase = await createClient();

  const siteUrl = getSiteUrl();

  const { error } = await supabase.auth.signUp({
    email,
    password,

    options: {
      data: {
        full_name: fullName,
      },

      emailRedirectTo: siteUrl,
    },
  });

  if (error) {
    console.error("Aurora registration error:", error);

    redirect(
      `/register?error=${encodeURIComponent(
        "Unable to create your account. Please try again.",
      )}`,
    );
  }

  redirect(`/checkemail?email=${encodeURIComponent(email)}`);
}

/*
 * =========================================================
 * GOOGLE AUTHENTICATION
 * =========================================================
 */

export async function signInWithGoogle(formData) {
  const next = safeRedirect(formData?.get("next"), "/account");

  const supabase = await createClient();

  const siteUrl = getSiteUrl();

  const callbackUrl = `${siteUrl}/callback?next=${encodeURIComponent(next)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",

    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error) {
    console.error("Google authentication error:", error);

    redirect(
      `/login?error=${encodeURIComponent("Unable to continue with Google.")}`,
    );
  }

  if (!data?.url) {
    redirect(
      `/login?error=${encodeURIComponent(
        "Google authentication could not be started.",
      )}`,
    );
  }

  /*
   * signInWithOAuth() does not automatically redirect
   * when executed server-side.
   *
   * Supabase gives us the provider authorization URL,
   * so Next.js redirects the browser manually.
   */
  redirect(data.url);
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");

  redirect("/");
}
