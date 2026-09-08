"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";

import Auroralogo from "../../../../public/Aurora.png";
import { login, signInWithGoogle } from "../actions";

function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="
        flex w-full cursor-pointer items-center justify-center gap-2
        rounded-lg bg-black px-4 py-2.5
        text-sm font-medium text-white shadow-sm
        transition
        hover:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2
        active:scale-[0.99]
        disabled:cursor-not-allowed disabled:opacity-70
        disabled:active:scale-100
      "
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Signing in...</span>
        </>
      ) : (
        <span>Sign in</span>
      )}
    </button>
  );
}

function GoogleSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="
        flex w-full cursor-pointer items-center justify-center gap-3
        rounded-lg border border-gray-300 px-4 py-2.5
        text-sm font-medium text-gray-700
        transition
        hover:bg-gray-50
        focus:outline-none focus:ring-2 focus:ring-black/10 focus:ring-offset-2
        active:scale-[0.99]
        disabled:cursor-not-allowed disabled:opacity-70
        disabled:active:scale-100
      "
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <GoogleIcon />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.88c2.27-2.09 3.58-5.17 3.58-8.84z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.28v3.11C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28V6.61H1.28A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.28 5.39z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.61l4 3.11C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </svg>
  );
}

export default function LoginClient({ error, next }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gray-50 px-5 py-10 sm:px-6">
      {/* Home */}
      <div className="absolute left-4 top-5 md:left-6 md:top-6">
        <Link
          href="/"
          className="
            flex items-center gap-1.5 rounded-full bg-black
            px-3 py-2 text-sm text-white
            transition
            hover:bg-gray-800
            focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2
            active:scale-[0.98]
          "
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Home</span>
        </Link>
      </div>

      <div className="w-full max-w-lg">
        <div className="rounded-2xl md:p-8">
          {/* Logo */}
          <div className="mb-4 flex justify-center">
            <Image
              src={Auroralogo}
              alt="Aurora Logo"
              priority
              className="h-auto w-auto max-w-100"
            />
          </div>

          {/* Heading */}
          <div className="mb-6 text-left">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Sign in
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Welcome back. Sign in to your Aurora account.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="
                mb-5 flex items-start gap-3 rounded-lg
                border border-red-200 bg-red-50 p-3
                text-sm text-red-700
              "
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

              <div className="min-w-0">
                <p className="font-medium">Unable to sign in</p>
                <p className="mt-0.5 break-words text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Email/password */}
          <form action={login} className="space-y-4">
            <input type="hidden" name="next" value={next} />

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email
              </label>

              <div className="relative">
                <Mail
                  aria-hidden="true"
                  className="
                    pointer-events-none absolute left-3 top-1/2
                    h-4 w-4 -translate-y-1/2 text-gray-400
                  "
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  className="
                    w-full rounded-lg border border-gray-300
                    py-2.5 pl-10 pr-3 text-sm
                    text-gray-900 outline-none
                    transition
                    placeholder:text-gray-400
                    focus:border-black
                    focus:ring-2 focus:ring-black/10
                  "
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-4">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="
                    shrink-0 text-xs font-medium text-gray-500
                    underline-offset-2 transition
                    hover:text-black hover:underline
                    focus:outline-none focus:underline
                  "
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <LockKeyhole
                  aria-hidden="true"
                  className="
                    pointer-events-none absolute left-3 top-1/2
                    h-4 w-4 -translate-y-1/2 text-gray-400
                  "
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="
                    w-full rounded-lg border border-gray-300
                    py-2.5 pl-10 pr-11 text-sm
                    text-gray-900 outline-none
                    transition
                    placeholder:text-gray-400
                    focus:border-black
                    focus:ring-2 focus:ring-black/10
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="
                    absolute right-2 top-1/2
                    flex h-8 w-8 -translate-y-1/2
                    cursor-pointer items-center justify-center
                    rounded-md text-gray-400
                    transition
                    hover:bg-gray-100 hover:text-gray-700
                    focus:outline-none focus:ring-2 focus:ring-black/10
                  "
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <LoginSubmitButton />
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>

            <div className="relative flex justify-center text-xs">
              <span className="bg-gray-50 px-3 text-gray-400">
                or continue with
              </span>
            </div>
          </div>

          {/* Google */}
          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next} />

            <GoogleSubmitButton />
          </form>
        </div>

        {/* Register */}
        <p className="mt-2 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="
              font-medium text-black underline underline-offset-2
              transition hover:text-gray-700
              focus:outline-none focus:ring-2 focus:ring-black/10
            "
          >
            Create account
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-400">
          Secure access to your Aurora account
        </p>
      </div>
    </main>
  );
}
