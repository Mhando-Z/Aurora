import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

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

function getSiteUrl(request) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (configuredUrl) {
    return configuredUrl;
  }

  return new URL(request.url).origin;
}

export async function GET(request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");

  const next = safeRedirect(requestUrl.searchParams.get("next"), "/account");

  const oauthError = requestUrl.searchParams.get("error");

  const oauthErrorDescription =
    requestUrl.searchParams.get("error_description");

  const siteUrl = getSiteUrl(request);

  /*
   * User denied Google authentication
   * or OAuth provider returned an error.
   */
  if (oauthError) {
    console.error("Google OAuth error:", {
      error: oauthError,
      description: oauthErrorDescription,
    });

    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "Google authentication was cancelled or failed.",
        )}`,
        siteUrl,
      ),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "Authentication code was not returned.",
        )}`,
        siteUrl,
      ),
    );
  }

  const supabase = await createClient();

  /*
   * Exchange PKCE authorization code
   * for Supabase access + refresh tokens.
   *
   * @supabase/ssr stores them in cookies.
   */
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Aurora OAuth code exchange error:", error);

    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "Unable to complete Google authentication.",
        )}`,
        siteUrl,
      ),
    );
  }

  return NextResponse.redirect(new URL(next, siteUrl));
}
