import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function safeNext(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/account";
  }

  return value;
}

export async function GET(request) {
  const url = new URL(request.url);

  const tokenHash = url.searchParams.get("token_hash");

  const type = url.searchParams.get("type");

  const next = safeNext(url.searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }

    console.error("Aurora email confirmation error:", error);
  }

  return NextResponse.redirect(new URL("/auth/error", request.url));
}
