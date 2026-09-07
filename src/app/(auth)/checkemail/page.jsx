"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, ArrowLeft, Sparkles } from "lucide-react";

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

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center backdrop-blur-sm"
      >
        {/* Icon + congratulatory check badge */}
        <motion.div variants={rise} className="relative mx-auto mb-8 h-20 w-20">
          {/* aurora glow, sits once behind the icon */}
          <div
            className="absolute inset-[-30%] rounded-full opacity-40 blur-2xl"
            style={{
              background:
                "radial-gradient(circle, #5EEAD4 0%, #A78BFA 60%, transparent 80%)",
            }}
          />
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 18,
              delay: 0.2,
            }}
            className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-[#111a2e]"
          >
            <Mail className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          </motion.div>

          <motion.div
            initial={{ scale: 0, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 14,
              delay: 0.55,
            }}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-teal-400 ring-4 ring-[#0B1120]"
          >
            <CheckCircle2
              className="h-5 w-5 text-[#0B1120]"
              strokeWidth={2.5}
            />
          </motion.div>
        </motion.div>

        <motion.div
          variants={rise}
          className="mb-2 flex items-center justify-center gap-1.5 text-sm font-medium text-teal-300"
        >
          <Sparkles className="h-4 w-4" strokeWidth={2} />
          Welcome to Aurora
        </motion.div>

        <motion.h1
          variants={rise}
          className="text-2xl font-semibold tracking-tight text-slate-50"
        >
          Check your email
        </motion.h1>

        <motion.p
          variants={rise}
          className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-slate-400"
        >
          We've sent a confirmation link to your inbox. Open it to activate your
          account and start using Aurora.
        </motion.p>

        <motion.div
          variants={rise}
          className="mt-8 border-t border-white/10 pt-6"
        >
          <p className="text-sm text-slate-500">
            Didn't get it?{" "}
            <button
              type="button"
              className="text-slate-300 underline decoration-slate-600 underline-offset-4 transition-colors hover:text-teal-300 hover:decoration-teal-300"
            >
              Resend email
            </button>
          </p>
        </motion.div>

        <motion.div variants={rise} className="mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Return to sign in
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
