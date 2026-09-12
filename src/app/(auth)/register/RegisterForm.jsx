"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";

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
  const value = name?.trim();

  if (!value) return "Full name is required.";
  if (value.length < 2) return "Enter your full name.";

  if (!/^[a-zA-ZÀ-ÿ' -]+$/.test(value)) {
    return "Full name contains invalid characters.";
  }

  return "";
}

function validateEmail(email) {
  const value = email?.trim().toLowerCase();

  if (!value) return "Email is required.";

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!regex.test(value)) {
    return "Enter a valid email address.";
  }

  const domain = value.split("@")[1];

  if (domain && DISPOSABLE_DOMAINS.has(domain)) {
    return "Temporary or disposable email addresses aren't allowed.";
  }

  return "";
}

function validatePassword(password) {
  if (!password) return "Password is required.";

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[a-z]/.test(password)) {
    return "Add at least one lowercase letter.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Add at least one uppercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Add at least one number.";
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return "This password is too common. Choose something more unique.";
  }

  return "";
}

function getPasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: "",
      color: "",
    };
  }

  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    return {
      score: 1,
      label: "Weak",
      color: "bg-red-400",
    };
  }

  if (score === 2) {
    return {
      score: 2,
      label: "Fair",
      color: "bg-yellow-400",
    };
  }

  if (score <= 4) {
    return {
      score: 3,
      label: "Good",
      color: "bg-blue-400",
    };
  }

  return {
    score: 4,
    label: "Strong",
    color: "bg-green-500",
  };
}

function RegisterSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="
        flex w-full cursor-pointer items-center justify-center gap-2
        rounded-lg bg-black px-4 py-2.5
        text-sm font-medium text-white shadow-sm
        transition
        hover:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2
        active:scale-[0.99]
        disabled:cursor-not-allowed disabled:opacity-70
        disabled:active:scale-100
      "
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Creating account...</span>
        </>
      ) : (
        <span>Create account</span>
      )}
    </button>
  );
}

function GoogleSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="
        flex w-full cursor-pointer items-center justify-center gap-3
        rounded-lg border border-gray-300
        px-4 py-2.5 text-sm font-medium text-gray-700
        transition
        hover:bg-gray-50
        focus:outline-none focus:ring-2 focus:ring-black/10 focus:ring-offset-2
        active:scale-[0.99]
        disabled:cursor-not-allowed disabled:opacity-70
        disabled:active:scale-100
      "
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <GoogleIcon />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
  );
}

function Requirement({ valid, children }) {
  return (
    <div
      className={`flex items-center gap-1.5 text-xs transition ${
        valid ? "text-gray-700" : "text-gray-400"
      }`}
    >
      <div
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          valid
            ? "border-gray-700 bg-gray-700 text-white"
            : "border-gray-300 text-transparent"
        }`}
      >
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </div>

      <span>{children}</span>
    </div>
  );
}

export default function RegisterForm({
  registerAction,
  next = "/account",
  error,
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const strength = getPasswordStrength(password);

  const passwordRequirements = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const allPasswordRequirementsPassed =
    passwordRequirements.length &&
    passwordRequirements.lowercase &&
    passwordRequirements.uppercase &&
    passwordRequirements.number;

  function getFieldValue(field, overrides = {}) {
    switch (field) {
      case "fullName":
        return overrides.fullName ?? fullName;

      case "email":
        return overrides.email ?? email;

      case "password":
        return overrides.password ?? password;

      case "confirmPassword":
        return overrides.confirmPassword ?? confirmPassword;

      default:
        return "";
    }
  }

  function runFieldValidation(field, overrides = {}) {
    const currentPassword = getFieldValue("password", overrides);
    const currentConfirmPassword = getFieldValue("confirmPassword", overrides);

    switch (field) {
      case "fullName":
        return validateFullName(getFieldValue("fullName", overrides));

      case "email":
        return validateEmail(getFieldValue("email", overrides));

      case "password":
        return validatePassword(currentPassword);

      case "confirmPassword":
        if (!currentConfirmPassword) {
          return "Confirm your password.";
        }

        return currentPassword !== currentConfirmPassword
          ? "Passwords do not match."
          : "";

      default:
        return "";
    }
  }

  function validateTouchedField(field, overrides = {}) {
    if (!touched[field]) return;

    setErrors((current) => ({
      ...current,
      [field]: runFieldValidation(field, overrides),
    }));
  }

  function handleFullNameChange(event) {
    const value = event.target.value;

    setFullName(value);
    validateTouchedField("fullName", {
      fullName: value,
    });
  }

  function handleEmailChange(event) {
    const value = event.target.value;

    setEmail(value);
    validateTouchedField("email", {
      email: value,
    });
  }

  function handlePasswordChange(event) {
    const value = event.target.value;

    setPassword(value);

    if (touched.password) {
      setErrors((current) => ({
        ...current,
        password: validatePassword(value),
      }));
    }

    if (touched.confirmPassword && confirmPassword) {
      setErrors((current) => ({
        ...current,
        confirmPassword:
          value !== confirmPassword ? "Passwords do not match." : "",
      }));
    }
  }

  function handleConfirmPasswordChange(event) {
    const value = event.target.value;

    setConfirmPassword(value);

    if (touched.confirmPassword) {
      setErrors((current) => ({
        ...current,
        confirmPassword: password !== value ? "Passwords do not match." : "",
      }));
    }
  }

  function handleBlur(field) {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));

    setErrors((current) => ({
      ...current,
      [field]: runFieldValidation(field),
    }));
  }

  function handleSubmit(event) {
    const nextErrors = {
      fullName: validateFullName(fullName),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: !confirmPassword
        ? "Confirm your password."
        : password !== confirmPassword
          ? "Passwords do not match."
          : "",
    };

    setErrors(nextErrors);

    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (Object.values(nextErrors).some(Boolean)) {
      event.preventDefault();

      requestAnimationFrame(() => {
        const firstInvalid = document.querySelector('[aria-invalid="true"]');

        firstInvalid?.focus();
      });
    }
  }

  const inputClass = (field) => {
    const invalid = touched[field] && errors[field];
    const valid =
      touched[field] && !errors[field] && getFieldValue(field)?.trim?.();

    return `
      w-full rounded-lg border
      py-2.5 text-sm text-gray-900
      outline-none transition
      placeholder:text-gray-400
      ${
        invalid
          ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
          : valid
            ? "border-gray-400 focus:border-black focus:ring-2 focus:ring-black/10"
            : "border-gray-300 focus:border-black focus:ring-2 focus:ring-black/10"
      }
    `;
  };

  return (
    <div>
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="
            mb-5 flex items-start gap-3
            rounded-lg border border-red-200 bg-red-50
            p-3 text-sm text-red-700
          "
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <div>
            <p className="font-medium">Unable to create account</p>

            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form
        action={registerAction}
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4"
      >
        <input type="hidden" name="next" value={next} />

        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Full name
          </label>

          <div className="relative">
            <User
              className="
                pointer-events-none absolute left-3 top-1/2
                h-4 w-4 -translate-y-1/2 text-gray-400
              "
            />

            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              autoComplete="name"
              placeholder="Jane Doe"
              value={fullName}
              onChange={handleFullNameChange}
              onBlur={() => handleBlur("fullName")}
              aria-invalid={touched.fullName && !!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              className={`${inputClass("fullName")} pl-10 pr-10`}
            />

            {touched.fullName && !errors.fullName && fullName.trim() && (
              <CheckCircle2
                className="
                    absolute right-3 top-1/2
                    h-4 w-4 -translate-y-1/2
                    text-gray-400
                  "
              />
            )}
          </div>

          {touched.fullName && errors.fullName && (
            <p
              id="fullName-error"
              className="mt-1.5 flex items-center gap-1 text-xs text-red-600"
            >
              <AlertCircle className="h-3 w-3 shrink-0" />
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Email
          </label>

          <div className="relative">
            <Mail
              className="
                pointer-events-none absolute left-3 top-1/2
                h-4 w-4 -translate-y-1/2 text-gray-400
              "
            />

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => {
                const normalizedEmail = email.trim().toLowerCase();

                setEmail(normalizedEmail);

                setTouched((current) => ({
                  ...current,
                  email: true,
                }));

                setErrors((current) => ({
                  ...current,
                  email: validateEmail(normalizedEmail),
                }));
              }}
              aria-invalid={touched.email && !!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`${inputClass("email")} pl-10 pr-10`}
            />

            {touched.email && !errors.email && email.trim() && (
              <CheckCircle2
                className="
                    absolute right-3 top-1/2
                    h-4 w-4 -translate-y-1/2
                    text-gray-400
                  "
              />
            )}
          </div>

          {touched.email && errors.email && (
            <p
              id="email-error"
              className="mt-1.5 flex items-center gap-1 text-xs text-red-600"
            >
              <AlertCircle className="h-3 w-3 shrink-0" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Password
          </label>

          <div className="relative">
            <LockKeyhole
              className="
                pointer-events-none absolute left-3 top-1/2
                h-4 w-4 -translate-y-1/2 text-gray-400
              "
            />

            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => handleBlur("password")}
              aria-invalid={touched.password && !!errors.password}
              aria-describedby="password-requirements password-error"
              className={`${inputClass("password")} pl-10 pr-11`}
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="
                absolute right-2 top-1/2
                flex h-8 w-8 -translate-y-1/2
                cursor-pointer items-center justify-center
                rounded-md text-gray-400
                transition
                hover:bg-gray-100 hover:text-gray-700
                focus:outline-none focus:ring-2 focus:ring-black/10
              "
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {password && (
            <div id="password-requirements" className="mt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">Password strength</span>

                <span className="text-xs font-medium text-gray-600">
                  {strength.label}
                </span>
              </div>

              <div className="flex gap-1">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      index < strength.score ? strength.color : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <Requirement valid={passwordRequirements.length}>
                  8+ characters
                </Requirement>

                <Requirement valid={passwordRequirements.uppercase}>
                  Uppercase letter
                </Requirement>

                <Requirement valid={passwordRequirements.lowercase}>
                  Lowercase letter
                </Requirement>

                <Requirement valid={passwordRequirements.number}>
                  One number
                </Requirement>
              </div>
            </div>
          )}

          {touched.password &&
            errors.password &&
            !allPasswordRequirementsPassed && (
              <p
                id="password-error"
                className="mt-2 flex items-center gap-1 text-xs text-red-600"
              >
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errors.password}
              </p>
            )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Confirm password
          </label>

          <div className="relative">
            <LockKeyhole
              className="
                pointer-events-none absolute left-3 top-1/2
                h-4 w-4 -translate-y-1/2 text-gray-400
              "
            />

            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              onBlur={() => handleBlur("confirmPassword")}
              aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "confirmPassword-error" : undefined
              }
              className={`${inputClass("confirmPassword")} pl-10 pr-20`}
            />

            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
              {confirmPassword && password === confirmPassword && (
                <CheckCircle2 className="mr-1 h-4 w-4 text-gray-400" />
              )}

              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                aria-pressed={showConfirmPassword}
                className="
                  flex h-8 w-8 cursor-pointer
                  items-center justify-center
                  rounded-md text-gray-400
                  transition
                  hover:bg-gray-100 hover:text-gray-700
                  focus:outline-none focus:ring-2 focus:ring-black/10
                "
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {touched.confirmPassword && errors.confirmPassword && (
            <p
              id="confirmPassword-error"
              className="mt-1.5 flex items-center gap-1 text-xs text-red-600"
            >
              <AlertCircle className="h-3 w-3 shrink-0" />
              {errors.confirmPassword}
            </p>
          )}

          {confirmPassword && password === confirmPassword && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
              <Check className="h-3 w-3" />
              Passwords match
            </p>
          )}
        </div>

        <div className="pt-1">
          <RegisterSubmitButton />
        </div>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>

        <div className="relative flex justify-center text-xs">
          <span className="bg-gray-50 px-3 text-gray-400">
            or continue with
          </span>
        </div>
      </div>

      {/* Google Registration */}
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />

        <GoogleSubmitButton />
      </form>
    </div>
  );
}
