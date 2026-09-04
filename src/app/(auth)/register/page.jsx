import Link from "next/link";
import { register } from "../actions/page";

export default async function RegisterPage({ searchParams }) {
  const params = await searchParams;

  const error = params?.error;

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create your Aurora account</h1>

          <p className="mt-2 text-sm text-gray-600">
            Create an account to save addresses, track orders and manage your
            purchases.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form action={register} className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="mb-1 block text-sm font-medium"
            >
              Full name
            </label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              autoComplete="name"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

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
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium"
            >
              Confirm password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white"
          >
            Create account
          </button>
        </form>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="font-medium underline">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
