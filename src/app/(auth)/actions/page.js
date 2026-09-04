"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

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

export async function login(formData) {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") || "");

  const next = safeRedirect(formData.get("next"));

  if (!email || !password) {
    redirect(
      `/auth/login?error=${encodeURIComponent(
        "Email and password are required.",
      )}`,
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      `/auth/login?error=${encodeURIComponent("Invalid email or password.")}`,
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
      `/auth/register?error=${encodeURIComponent(
        "Please complete all required fields.",
      )}`,
    );
  }

  if (password.length < 8) {
    redirect(
      `/auth/register?error=${encodeURIComponent(
        "Password must contain at least 8 characters.",
      )}`,
    );
  }

  if (password !== confirmPassword) {
    redirect(
      `/auth/register?error=${encodeURIComponent("Passwords do not match.")}`,
    );
  }

  const supabase = await createClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
      `/auth/register?error=${encodeURIComponent(
        "Unable to create your account. Please try again.",
      )}`,
    );
  }

  redirect("/auth/check-email");
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");

  redirect("/");
}
