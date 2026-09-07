"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { KeyRound, XCircle, ArrowLeft } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B1120] px-6 py-16">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center backdrop-blur-sm"
      >
        {/* Icon + error badge */}
        <motion.div variants={rise} className="relative mx-auto mb-8 h-20 w-20">
          <div
            className="absolute inset-[-30%] rounded-full opacity-40 blur-2xl"
            style={{
              background:
                "radial-gradient(circle, #FBBF24 0%, #FB7185 60%, transparent 80%)",
            }}
          />
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              x: [0, -6, 6, -4, 4, 0],
            }}
            transition={{
              scale: {
                type: "spring",
                stiffness: 260,
                damping: 18,
                delay: 0.2,
              },
              opacity: { duration: 0.3, delay: 0.2 },
              x: { duration: 0.5, delay: 0.65, ease: "easeInOut" },
            }}
            className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-[#111a2e]"
          >
            <KeyRound className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          </motion.div>

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 16,
              delay: 0.55,
            }}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-400 ring-4 ring-[#0B1120]"
          >
            <XCircle className="h-5 w-5 text-[#0B1120]" strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        <motion.div
          variants={rise}
          className="mb-2 text-sm font-medium text-rose-300"
        >
          Sign-in link invalid
        </motion.div>

        <motion.h1
          variants={rise}
          className="text-2xl font-semibold tracking-tight"
        >
          Authentication failed
        </motion.h1>

        <motion.p
          variants={rise}
          className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-slate-400"
        >
          This link has expired or was already used. Request a new one from the
          sign-in page to continue.
        </motion.p>

        <motion.div variants={rise} className="mt-8">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors "
          >
            Return to sign in
          </Link>
        </motion.div>

        {/* <motion.div variants={rise} className="mt-5">
          <Link
            href="/support"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Contact support instead
          </Link>
        </motion.div> */}
      </motion.div>
    </main>
  );
}
