"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Loader2,
  CircleCheck,
  CircleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const rise = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const RESEND_COOLDOWN = 60;

export default function CheckEmail({ email }) {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!email) return;

    const storageKey = `aurora-email-resend-${email}`;
    const savedExpiry = sessionStorage.getItem(storageKey);

    if (!savedExpiry) return;

    const remaining = Math.ceil((Number(savedExpiry) - Date.now()) / 1000);

    if (remaining > 0) {
      setCooldown(remaining);
    } else {
      sessionStorage.removeItem(storageKey);
    }
  }, [email]);

  /**
   * Countdown timer
   */
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          if (email) {
            sessionStorage.removeItem(`aurora-email-resend-${email}`);
          }

          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown, email]);

  /**
   * Resend signup verification email
   */
  const handleResend = async () => {
    if (!email || loading || cooldown > 0) return;

    const supabase = await createClient();

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: siteUrl,
        },
      });

      if (error) {
        throw error;
      }

      /**
       * Start 60 second cooldown only after
       * Supabase successfully accepts the resend.
       */
      const expiry = Date.now() + RESEND_COOLDOWN * 1000;

      sessionStorage.setItem(`aurora-email-resend-${email}`, expiry.toString());

      setCooldown(RESEND_COOLDOWN);

      setMessage("Verification email sent. Please check your inbox.");
    } catch (error) {
      console.error("Aurora resend verification error:", error);

      /**
       * Avoid exposing unnecessary Supabase/internal
       * errors directly to the user.
       */
      if (error?.message?.toLowerCase().includes("rate limit")) {
        setErrorMessage(
          "You've requested too many emails. Please wait a moment before trying again.",
        );
      } else {
        setErrorMessage(
          "Unable to resend the verification email. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const resendDisabled = loading || cooldown > 0 || !email;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-md rounded-2xl border border-gray-900 bg-white p-10 text-center shadow-2xs backdrop-blur-sm"
      >
        {/* Icon + congratulatory check badge */}
        <motion.div variants={rise} className="relative mx-auto mb-8 h-20 w-20">
          {/* Aurora glow */}
          <div
            className="absolute inset-[-30%] rounded-full opacity-40 blur-2xl"
            style={{
              background:
                "radial-gradient(circle, #86EFAC 0%, #16A34A 60%, transparent 80%)",
            }}
          />

          <motion.div
            initial={{
              scale: 0.6,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 18,
              delay: 0.2,
            }}
            className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black"
          >
            <Mail className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          </motion.div>

          <motion.div
            initial={{
              scale: 0,
              rotate: -20,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              rotate: 0,
              opacity: 1,
            }}
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

        {/* Welcome */}
        <motion.div
          variants={rise}
          className="mb-2 flex items-center justify-center gap-1.5 text-sm font-medium text-black"
        >
          <Sparkles className="h-4 w-4" strokeWidth={2} />
          Welcome to Aurora
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={rise}
          className="text-2xl font-semibold tracking-tight text-black"
        >
          Check your email
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={rise}
          className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-gray-600"
        >
          We've sent a confirmation link to your inbox. Open it to activate your
          account and start using Aurora.
        </motion.p>

        {/* User email */}
        {email && (
          <motion.div variants={rise} className="mt-5">
            <div className="inline-flex max-w-full items-center gap-2 rounded-lg bg-gray-100 px-4 py-2">
              <Mail className="h-4 w-4 shrink-0 text-gray-500" />

              <span className="truncate text-sm font-medium text-gray-800">
                {email}
              </span>
            </div>
          </motion.div>
        )}

        {/* Missing email */}
        {!email && (
          <motion.div
            variants={rise}
            className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-left"
          >
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

            <p className="text-sm text-red-700">
              We couldn't determine your email address. Please return to
              registration and try again.
            </p>
          </motion.div>
        )}

        {/* Success */}
        {message && (
          <motion.div
            initial={{
              opacity: 0,
              y: 5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-5 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-left"
          >
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />

            <p className="text-sm text-green-700">{message}</p>
          </motion.div>
        )}

        {/* Error */}
        {errorMessage && (
          <motion.div
            initial={{
              opacity: 0,
              y: 5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-left"
          >
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

            <p className="text-sm text-red-700">{errorMessage}</p>
          </motion.div>
        )}

        {/* Resend */}
        <motion.div
          variants={rise}
          className="mt-8 border-t border-gray-200 pt-6"
        >
          <p className="text-sm text-gray-600">
            Didn't get it?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendDisabled}
              className={`inline-flex items-center gap-1.5 font-medium transition-colors ${
                resendDisabled
                  ? "cursor-not-allowed text-gray-400"
                  : "cursor-pointer text-blue-900 hover:underline hover:underline-offset-4"
              }`}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}

              {loading
                ? "Sending..."
                : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend email"}
            </button>
          </p>

          {cooldown > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3"
            >
              <p className="text-xs text-gray-500">
                You can request another email in {cooldown} second
                {cooldown !== 1 ? "s" : ""}.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Return */}
        <motion.div variants={rise} className="mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-700 transition-colors hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Return to sign in
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
