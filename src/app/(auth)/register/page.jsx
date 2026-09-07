// // import Link from "next/link";
// // import { register } from "../actions";

// // export default async function RegisterPage({ searchParams }) {
// //   const params = await searchParams;

// //   const error = params?.error;

// //   return (
// //     <main className="mx-auto max-w-md px-6 py-16">
// //       <div className="space-y-6">
// //         <div>
// //           <h1 className="text-3xl font-bold">Create your Aurora account</h1>

// //           <p className="mt-2 text-sm text-gray-600">
// //             Create an account to save addresses, track orders and manage your
// //             purchases.
// //           </p>
// //         </div>

// //         {error && (
// //           <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
// //             {error}
// //           </div>
// //         )}

// //         <form action={register} className="space-y-4">
// //           <div>
// //             <label
// //               htmlFor="fullName"
// //               className="mb-1 block text-sm font-medium"
// //             >
// //               Full name
// //             </label>

// //             <input
// //               id="fullName"
// //               name="fullName"
// //               type="text"
// //               required
// //               autoComplete="name"
// //               className="w-full rounded-lg border px-3 py-2"
// //             />
// //           </div>

// //           <div>
// //             <label htmlFor="email" className="mb-1 block text-sm font-medium">
// //               Email
// //             </label>

// //             <input
// //               id="email"
// //               name="email"
// //               type="email"
// //               required
// //               autoComplete="email"
// //               className="w-full rounded-lg border px-3 py-2"
// //             />
// //           </div>

// //           <div>
// //             <label
// //               htmlFor="password"
// //               className="mb-1 block text-sm font-medium"
// //             >
// //               Password
// //             </label>

// //             <input
// //               id="password"
// //               name="password"
// //               type="password"
// //               required
// //               minLength={8}
// //               autoComplete="new-password"
// //               className="w-full rounded-lg border px-3 py-2"
// //             />
// //           </div>

// //           <div>
// //             <label
// //               htmlFor="confirmPassword"
// //               className="mb-1 block text-sm font-medium"
// //             >
// //               Confirm password
// //             </label>

// //             <input
// //               id="confirmPassword"
// //               name="confirmPassword"
// //               type="password"
// //               required
// //               minLength={8}
// //               autoComplete="new-password"
// //               className="w-full rounded-lg border px-3 py-2"
// //             />
// //           </div>

// //           <button
// //             type="submit"
// //             className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white"
// //           >
// //             Create account
// //           </button>
// //         </form>

// //         <div className="text-center text-sm">
// //           Already have an account?{" "}
// //           <Link href="/login" className="font-medium underline">
// //             Sign in
// //           </Link>
// //         </div>
// //       </div>
// //     </main>
// //   );
// // }

// import Link from "next/link";
// import { register } from "../actions";

// export default async function RegisterPage({ searchParams }) {
//   const params = await searchParams;

//   const error = params?.error;

//   return (
//     <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-16">
//       <div className="w-full max-w-md">
//         {/* Brand mark */}
//         <div className="mb-8 flex justify-center">
//           <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-lg font-bold text-white shadow-sm">
//             A
//           </div>
//         </div>

//         {/* Card */}
//         <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
//           <div className="mb-6 text-center">
//             <h1 className="text-2xl font-bold tracking-tight text-gray-900">
//               Create your Aurora account
//             </h1>
//             <p className="mt-2 text-sm text-gray-500">
//               Save addresses, track orders and manage your purchases.
//             </p>
//           </div>

//           {error && (
//             <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
//               <svg
//                 className="mt-0.5 h-4 w-4 flex-shrink-0"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
//                 />
//               </svg>
//               <span>{error}</span>
//             </div>
//           )}

//           <form action={register} className="space-y-4">
//             <div>
//               <label
//                 htmlFor="fullName"
//                 className="mb-1.5 block text-sm font-medium text-gray-700"
//               >
//                 Full name
//               </label>

//               <input
//                 id="fullName"
//                 name="fullName"
//                 type="text"
//                 required
//                 autoComplete="name"
//                 placeholder="Jane Doe"
//                 className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
//               />
//             </div>

//             <div>
//               <label
//                 htmlFor="email"
//                 className="mb-1.5 block text-sm font-medium text-gray-700"
//               >
//                 Email
//               </label>

//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 required
//                 autoComplete="email"
//                 placeholder="you@example.com"
//                 className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
//               />
//             </div>

//             <div>
//               <label
//                 htmlFor="password"
//                 className="mb-1.5 block text-sm font-medium text-gray-700"
//               >
//                 Password
//               </label>

//               <input
//                 id="password"
//                 name="password"
//                 type="password"
//                 required
//                 minLength={8}
//                 autoComplete="new-password"
//                 placeholder="••••••••"
//                 className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
//               />
//               <p className="mt-1.5 text-xs text-gray-400">
//                 Must be at least 8 characters.
//               </p>
//             </div>

//             <div>
//               <label
//                 htmlFor="confirmPassword"
//                 className="mb-1.5 block text-sm font-medium text-gray-700"
//               >
//                 Confirm password
//               </label>

//               <input
//                 id="confirmPassword"
//                 name="confirmPassword"
//                 type="password"
//                 required
//                 minLength={8}
//                 autoComplete="new-password"
//                 placeholder="••••••••"
//                 className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
//               />
//             </div>

//             <button
//               type="submit"
//               className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 active:scale-[0.99]"
//             >
//               Create account
//             </button>
//           </form>

//           <p className="mt-6 text-center text-xs leading-relaxed text-gray-400">
//             By creating an account, you agree to Aurora's{" "}
//             <Link
//               href="/terms"
//               className="underline underline-offset-2 hover:text-gray-600"
//             >
//               Terms of Service
//             </Link>{" "}
//             and{" "}
//             <Link
//               href="/privacy"
//               className="underline underline-offset-2 hover:text-gray-600"
//             >
//               Privacy Policy
//             </Link>
//             .
//           </p>
//         </div>

//         <p className="mt-6 text-center text-sm text-gray-500">
//           Already have an account?{" "}
//           <Link
//             href="/login"
//             className="font-medium text-black underline underline-offset-2"
//           >
//             Sign in
//           </Link>
//         </p>
//       </div>
//     </main>
//   );
// }

import Link from "next/link";
import { register, signInWithGoogle } from "../actions";
import RegisterForm from "./RegisterForm";
import Image from "next/image";
import Auroralogo from "../../../../public/Aurora.png";

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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <div className="">
          {/* Brand logo */}
          <div className="justify-center">
            <Image src={Auroralogo} alt="Aurora Logo" className="" />
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

          <form className="mt-3" action={signInWithGoogle}>
            <input type="hidden" name="next" value={next} />

            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.99]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
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
              Continue with Google
            </button>
          </form>

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
    </main>
  );
}
