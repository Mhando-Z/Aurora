import Link from "next/link";
import { register } from "../actions";
import RegisterForm from "./RegisterForm";
import Image from "next/image";
import Auroralogo from "../../../../public/Aurora.png";
import { ArrowLeft } from "lucide-react";

const metadata = {
  title: "Register - Aurora",
  description: "Create your Aurora account.",
};

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

export default async function RegisterPage({ searchParams }) {
  const params = await searchParams;
  const next = safeNext(params?.next);
  const error = params?.error;

  return (
    <main className="flex relative min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <div className="">
          {/* Brand logo */}
          <div className="flex justify-center">
            <Image
              src={Auroralogo}
              alt="Aurora Logo"
              priority
              className="h-auto w-auto max-w-100"
            />
          </div>
          <div className="mb-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Create your account
            </h1>
            <p className="text-sm text-gray-500">
              Save addresses, track orders and manage your purchases.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <RegisterForm registerAction={register} />

          <p className="mt-4 text-center text-xs leading-relaxed text-gray-400">
            By creating an account, you agree to Aurora&apos;s{" "}
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-gray-600"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-gray-600"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <p className="mt-4 mb-10 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-black underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* home button */}
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
    </main>
  );
}
