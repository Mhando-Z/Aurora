import Link from "next/link";
import { login, signInWithGoogle } from "../actions";

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

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;

  const error = params?.error;

  const next = safeNext(params?.next);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back</h1>

          <p className="mt-2 text-sm text-gray-600">
            Sign in to your Aurora account.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form action={login} className="space-y-4">
          <input type="hidden" name="next" value={next} />

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-sm underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white"
          >
            Sign in
          </button>
        </form>

        <div className="text-center text-sm">
          Don't have an account?{" "}
          <Link href="/register" className="font-medium underline">
            Create account
          </Link>
        </div>
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>

        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-gray-500">or</span>
        </div>
      </div>

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-3 rounded-lg border px-4 py-3 font-medium transition hover:bg-gray-50"
        >
          <span className="text-lg font-bold">G</span>
          Continue with Google
        </button>
      </form>
    </main>
  );
}
