"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Home,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Package,
  ShoppingCart,
  User,
  UserPlus,
  X,
} from "lucide-react";

import Auroralogo from "../../public/Auroraicon.png";
import { useUser } from "@/context/UserContext";
import { logout } from "@/app/(auth)/actions";
import { useData } from "@/context/DataContext";

// Static: doesn't depend on any component state, so it should not be
// re-created on every render.
const NAVIGATION = [
  {
    name: "Home",
    href: "/",
    icon: Home,
    protected: false,
  },
  {
    name: "Orders",
    href: "/orders",
    icon: Package,
    protected: true,
  },
  {
    name: "Contact",
    href: "/contact",
    icon: Mail,
    protected: false,
  },
];

function Navbar() {
  const pathname = usePathname();

  const { user, fullName, email, avatarUrl, loading: userLoading } = useUser();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const { cartCount } = useData();

  const profileRef = useRef(null);
  const profileButtonRef = useRef(null);
  const profileMenuRef = useRef(null);
  const mobileToggleRef = useRef(null);

  // ---------------------------------------------------------
  // CLOSE MENUS WHEN ROUTE CHANGES
  // ---------------------------------------------------------

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // ---------------------------------------------------------
  // RESET AVATAR ERROR STATE IF THE URL CHANGES
  // ---------------------------------------------------------

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  // ---------------------------------------------------------
  // CLOSE PROFILE MENU WHEN CLICKING / TAPPING OUTSIDE
  // ---------------------------------------------------------

  useEffect(() => {
    function handleOutsideInteraction(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key !== "Escape") return;

      if (profileOpen) {
        setProfileOpen(false);
        profileButtonRef.current?.focus();
      }

      if (mobileOpen) {
        setMobileOpen(false);
        mobileToggleRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleOutsideInteraction);
    document.addEventListener("touchstart", handleOutsideInteraction);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideInteraction);
      document.removeEventListener("touchstart", handleOutsideInteraction);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileOpen, mobileOpen]);

  // ---------------------------------------------------------
  // FOCUS MANAGEMENT: move focus into the profile menu on open
  // ---------------------------------------------------------

  useEffect(() => {
    if (profileOpen) {
      const firstItem =
        profileMenuRef.current?.querySelector('[role="menuitem"]');
      firstItem?.focus();
    }
  }, [profileOpen]);

  // ---------------------------------------------------------
  // LOCK BODY SCROLL WHILE THE MOBILE MENU IS OPEN
  // ---------------------------------------------------------

  useEffect(() => {
    if (mobileOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [mobileOpen]);

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------

  const isActive = useCallback(
    (href) => {
      if (href === "/") {
        return pathname === "/";
      }

      return pathname.startsWith(href);
    },
    [pathname],
  );

  const initials =
    fullName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase() || "U";

  const visibleNavigation = useMemo(
    () => NAVIGATION.filter((item) => !item.protected || user),
    [user],
  );

  const closeProfileMenu = useCallback(() => {
    setProfileOpen(false);
    profileButtonRef.current?.focus();
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -70 }}
        animate={{ y: 0 }}
        transition={{
          duration: 0.45,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="fixed left-0 right-0 top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* ================================================= */}
          {/* LOGO */}
          {/* ================================================= */}

          <Link
            href="/"
            className="group flex items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2"
          >
            <motion.div
              whileHover={{
                scale: 1.05,
                rotate: -2,
              }}
              whileTap={{
                scale: 0.96,
              }}
              className="flex items-center justify-center"
            >
              <Image
                src={Auroralogo}
                alt="Aurora logo"
                priority
                className="h-10 w-auto object-contain"
              />
            </motion.div>

            <div className="leading-tight">
              <h1 className="text-sm font-bold tracking-tight text-black">
                Aurora
              </h1>

              <p className="text-[11px] font-medium text-black/50">
                Spare Parts
              </p>
            </div>
          </Link>

          {/* ================================================= */}
          {/* DESKTOP NAVIGATION */}
          {/* ================================================= */}

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {visibleNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 ${
                    active
                      ? "text-black"
                      : "text-black/55 hover:bg-black/4 hover:text-black"
                  }`}
                >
                  <Icon className="h-4 w-4" />

                  {item.name}

                  {active && (
                    <motion.span
                      layoutId="desktop-navigation"
                      className="absolute inset-x-3 -bottom-[11px] h-0.5 rounded-full bg-black"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ================================================= */}
          {/* DESKTOP RIGHT SIDE */}
          {/* ================================================= */}

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                {/* CART */}
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                >
                  <Link
                    href="/cart"
                    aria-label={`Shopping cart with ${cartCount} item${
                      cartCount === 1 ? "" : "s"
                    }`}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 ${
                      isActive("/cart")
                        ? "bg-black text-white"
                        : "text-black/65 hover:bg-black/5 hover:text-black"
                    }`}
                  >
                    <ShoppingCart className="h-[19px] w-[19px]" />

                    <AnimatePresence>
                      {cartCount > 0 && (
                        <motion.span
                          key={cartCount}
                          initial={{
                            scale: 0,
                            opacity: 0,
                          }}
                          animate={{
                            scale: 1,
                            opacity: 1,
                          }}
                          exit={{
                            scale: 0,
                            opacity: 0,
                          }}
                          className="absolute -right-1.5 -top-1.5 flex min-h-[19px] min-w-[19px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white ring-2 ring-white"
                        >
                          {cartCount > 99 ? "99+" : cartCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.div>

                {/* PROFILE */}
                <div ref={profileRef} className="relative">
                  <button
                    ref={profileButtonRef}
                    type="button"
                    onClick={() => setProfileOpen((current) => !current)}
                    className="flex items-center gap-2 rounded-xl p-1.5 pr-2 transition hover:bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                    aria-controls="profile-menu"
                  >
                    {avatarUrl && !avatarError ? (
                      <img
                        src={avatarUrl}
                        alt={fullName || "User"}
                        onError={() => setAvatarError(true)}
                        className="h-8 w-8 rounded-full object-cover ring-1 ring-black/10"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                        {initials}
                      </div>
                    )}
                    {/* user's full name and email */}
                    <div className="hidden max-w-[130px] text-left">
                      <p className="truncate text-xs font-semibold text-black">
                        {fullName || "My account"}
                      </p>

                      <p className="truncate text-[10px] text-black/45">
                        {email}
                      </p>
                    </div>

                    <motion.div
                      animate={{
                        rotate: profileOpen ? 180 : 0,
                      }}
                      className="cursor-pointer"
                    >
                      <ChevronDown className="h-4 w-4 text-black/45" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        ref={profileMenuRef}
                        id="profile-menu"
                        role="menu"
                        aria-label="Account menu"
                        initial={{
                          opacity: 0,
                          y: -8,
                          scale: 0.97,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          y: -8,
                          scale: 0.97,
                        }}
                        transition={{
                          duration: 0.16,
                        }}
                        className="absolute right-0 top-[calc(100%+10px)] w-60 overflow-hidden rounded-2xl border border-black/10 bg-white p-2 shadow-xl shadow-black/10"
                      >
                        <div className="border-b border-black/5 px-3 py-2.5">
                          <p className="truncate text-sm font-semibold text-black">
                            {fullName || "Aurora user"}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-black/50">
                            {email}
                          </p>
                        </div>

                        <div className="py-1">
                          <Link
                            href="/account"
                            role="menuitem"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-black/65 transition hover:bg-black/[0.04] hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
                          >
                            <User className="h-4 w-4" />
                            Profile
                          </Link>
                        </div>

                        <div className="border-t border-black/5 pt-1">
                          <form action={logout}>
                            <button
                              type="submit"
                              role="menuitem"
                              onClick={closeProfileMenu}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-black/65 transition hover:bg-black/[0.04] hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
                            >
                              <LogOut className="h-4 w-4" />
                              Logout
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                {/* LOGIN */}

                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-black/65 transition hover:bg-black/[0.04] hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>

                {/* REGISTER */}

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link
                    href="/register"
                    className="flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Register
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* ================================================= */}
          {/* MOBILE RIGHT SIDE */}
          {/* ================================================= */}

          <div className="flex items-center gap-2 md:hidden">
            {!userLoading && user && (
              <Link
                href="/cart"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-black/70 transition hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
                aria-label={`Shopping cart with ${cartCount} item${
                  cartCount === 1 ? "" : "s"
                }`}
              >
                <ShoppingCart className="h-5 w-5" />

                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute right-0 top-0 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black px-1 text-[9px] font-bold text-white ring-2 ring-white"
                    >
                      {cartCount > 99 ? "99+" : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )}

            <motion.button
              ref={mobileToggleRef}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-black transition hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </motion.button>
          </div>
        </div>

        {/* ================================================= */}
        {/* MOBILE MENU */}
        {/* ================================================= */}

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              id="mobile-menu"
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              transition={{
                duration: 0.25,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="overflow-hidden border-t border-black/5 bg-white md:hidden"
            >
              <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
                {/* USER PROFILE */}

                {!userLoading && user && (
                  <div className="mb-4 flex items-center gap-3 rounded-2xl bg-black/[0.03] p-3">
                    {avatarUrl && !avatarError ? (
                      <img
                        src={avatarUrl}
                        alt={fullName || "User"}
                        onError={() => setAvatarError(true)}
                        className="h-11 w-11 rounded-full object-cover ring-1 ring-black/10"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                        {initials}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {fullName || "Aurora user"}
                      </p>

                      <p className="truncate text-xs text-black/45">{email}</p>
                    </div>
                  </div>
                )}

                {/* MOBILE NAVIGATION */}

                <nav aria-label="Mobile" className="space-y-1">
                  {visibleNavigation.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 ${
                          active
                            ? "bg-black text-white"
                            : "text-black/65 hover:bg-black/[0.04] hover:text-black"
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                        {item.name}
                      </Link>
                    );
                  })}

                  {user && (
                    <>
                      <Link
                        href="/cart"
                        aria-current={isActive("/cart") ? "page" : undefined}
                        className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 ${
                          isActive("/cart")
                            ? "bg-black text-white"
                            : "text-black/65 hover:bg-black/[0.04] hover:text-black"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <ShoppingCart className="h-[18px] w-[18px]" />
                          Cart
                        </span>

                        {cartCount > 0 && (
                          <span
                            className={`flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                              isActive("/cart")
                                ? "bg-white text-black"
                                : "bg-black text-white"
                            }`}
                          >
                            {cartCount}
                          </span>
                        )}
                      </Link>

                      <Link
                        href="/account"
                        aria-current={isActive("/account") ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 ${
                          isActive("/account")
                            ? "bg-black text-white"
                            : "text-black/65 hover:bg-black/[0.04] hover:text-black"
                        }`}
                      >
                        <User className="h-[18px] w-[18px]" />
                        Profile
                      </Link>
                    </>
                  )}
                </nav>

                {/* MOBILE AUTH */}

                {!userLoading && (
                  <div className="mt-4 border-t border-black/5 pt-4">
                    {user ? (
                      <form action={logout}>
                        <button
                          type="submit"
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold text-black transition hover:bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </form>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href="/login"
                          className="flex items-center justify-center gap-2 rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
                        >
                          <LogIn className="h-4 w-4" />
                          Login
                        </Link>

                        <Link
                          href="/register"
                          className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          Register
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Prevent fixed navbar covering page content */}
      <div aria-hidden="true" className="h-[68px]" />
    </>
  );
}

export default Navbar;
