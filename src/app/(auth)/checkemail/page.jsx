import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16 text-center">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Check your email</h1>

        <p className="text-gray-600">
          We've sent you a confirmation link. Open the email and confirm your
          account to continue using Aurora.
        </p>

        <Link href="/login" className="inline-block underline">
          Return to sign in
        </Link>
      </div>
    </main>
  );
}
