import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16 text-center">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Authentication failed</h1>

        <p className="text-gray-600">
          The authentication link may have expired or is no longer valid.
        </p>

        <Link href="/login" className="inline-block underline">
          Return to sign in
        </Link>
      </div>
    </main>
  );
}
