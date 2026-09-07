"use client";

import { useState } from "react";
import { signInWithGoogle } from "../actions";

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "10minutemail.com",
  "yopmail.com",
  "throwawaymail.com",
  "sharklasers.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "fakeinbox.com",
  "mailnesia.com",
  "maildrop.cc",
  "mintemail.com",
  "moakt.com",
]);

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "12345678",
  "123456789",
  "qwerty123",
  "letmein",
  "welcome1",
  "admin123",
  "iloveyou",
  "abc12345",
  "password123",
  "11111111",
  "123123123",
  "monkey123",
]);

function validateFullName(name) {
  if (!name || name.trim().length < 2) return "Enter your full name.";
  return "";
}

function validateEmail(email) {
  if (!email) return "Email is required.";
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!regex.test(email)) return "Enter a valid email address.";
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (domain && DISPOSABLE_DOMAINS.has(domain)) {
    return "Temporary or disposable email addresses aren't allowed.";
  }
  return "";
}

function validatePassword(password) {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(password)) return "Add at least one lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Add at least one uppercase letter.";
  if (!/[0-9]/.test(password)) return "Add at least one number.";
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return "This password is too common. Choose something more unique.";
  }
  return "";
}

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Weak", color: "bg-red-400" },
    { label: "Fair", color: "bg-yellow-400" },
    { label: "Good", color: "bg-blue-400" },
    { label: "Strong", color: "bg-green-500" },
  ];
  return { score, ...levels[Math.max(score - 1, 0)] };
}

function EyeIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

export default function RegisterForm({ registerAction }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  function runFieldValidation(field) {
    switch (field) {
      case "fullName":
        return validateFullName(fullName);
      case "email":
        return validateEmail(email);
      case "password":
        return validatePassword(password);
      case "confirmPassword":
        return password !== confirmPassword ? "Passwords do not match." : "";
      default:
        return "";
    }
  }

  function handleBlur(field) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: runFieldValidation(field) }));
  }

  function handleSubmit(e) {
    const nextErrors = {
      fullName: validateFullName(fullName),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword:
        password !== confirmPassword ? "Passwords do not match." : "",
    };
    setErrors(nextErrors);
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (Object.values(nextErrors).some(Boolean)) {
      e.preventDefault(); // blocks submission until fixed
    }
    // otherwise the form submits normally and calls the server action
  }

  const strength = getPasswordStrength(password);

  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
      touched[field] && errors[field]
        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
        : "border-gray-300 focus:border-black focus:ring-black/10"
    }`;

  return (
    <div>
      <form
        action={registerAction}
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="fullName"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            autoComplete="name"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => handleBlur("fullName")}
            className={inputClass("fullName")}
          />
          {touched.fullName && errors.fullName && (
            <p className="mt-1.5 text-xs text-red-600">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur("email")}
            className={inputClass("email")}
          />
          {touched.email && errors.email && (
            <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur("password")}
              className={`${inputClass("password")} pr-10`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${i < strength.score ? strength.color : "bg-gray-200"}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-400">{strength.label}</p>
            </div>
          )}

          {touched.password && errors.password ? (
            <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
          ) : (
            <p className="mt-1.5 text-xs text-gray-400">
              At least 8 characters, with uppercase, lowercase and a number.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => handleBlur("confirmPassword")}
              className={`${inputClass("confirmPassword")} pr-10`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-600">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full cursor-pointer rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 active:scale-[0.99]"
        >
          Create account
        </button>
      </form>
    </div>
  );
}
