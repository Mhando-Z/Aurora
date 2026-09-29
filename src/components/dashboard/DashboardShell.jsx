"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

// --------------------------------------------------
// Navigation configuration
// --------------------------------------------------

const navigation = [
  {
    title: "WORKSPACE",
    items: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
      {
        label: "My profile",
        href: "/dashboard/account",
        icon: UserRound,
      },
      {
        label: "Addresses",
        href: "/account/addresses",
        icon: MapPin,
      },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      {
        label: "Security",
        href: "/account/security",
        icon: ShieldCheck,
      },
      {
        label: "Settings",
        href: "/account/settings",
        icon: Settings2,
      },
    ],
  },
];

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function getInitials(name, email) {
  const value = name?.trim() || email?.split("@")[0] || "User";

  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isActivePath(pathname, item) {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function getPageTitle(pathname) {
  const labels = {
    "/account": "Overview",
    "/account/profile": "My profile",
    "/account/addresses": "Addresses",
    "/account/security": "Security",
    "/account/settings": "Settings",
  };

  return labels[pathname] || "Account";
}

// --------------------------------------------------
// User avatar
// --------------------------------------------------

function UserAvatar({ user, size = "md" }) {
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  return (
    <div
      className={`
        relative flex shrink-0 items-center justify-center
        overflow-hidden rounded-full bg-black
        font-semibold text-white
        ${sizeClass}
      `}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.fullName || "User avatar"}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span>{getInitials(user.fullName, user.email)}</span>
      )}
    </div>
  );
}

// --------------------------------------------------
// Navigation item
// --------------------------------------------------

function NavigationItem({ item, pathname, onNavigate, badge, compact }) {
  const Icon = item.icon;
  const active = isActivePath(pathname, item);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={compact ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={`
        group relative flex h-10 items-center
        rounded-xl text-sm transition-colors duration-200
        ${compact ? "justify-center px-2" : "gap-3 px-3"}
        ${
          active
            ? "bg-black font-medium text-white"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
        }
      `}
    >
      <Icon size={18} strokeWidth={active ? 2.1 : 1.8} className="shrink-0" />

      {!compact && (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>

          {badge !== undefined && (
            <span
              className={`
                rounded-md px-2 py-0.5 text-[11px]
                ${
                  active
                    ? "bg-white/15 text-white"
                    : "bg-zinc-100 text-zinc-600"
                }
              `}
            >
              {badge}
            </span>
          )}

          {active && (
            <motion.span
              layoutId="dashboard-active-indicator"
              className="h-1.5 w-1.5 rounded-full bg-white"
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 32,
              }}
            />
          )}
        </>
      )}
    </Link>
  );
}

// --------------------------------------------------
// Sidebar
// --------------------------------------------------

function SidebarContent({
  user,
  pathname,
  onNavigate,
  logoutAction,
  compact = false,
}) {
  const [accountOpen, setAccountOpen] = useState(false);

  const displayName =
    user.fullName || user.email?.split("@")[0] || "My account";

  const roleLabels = user.roles.map((item) => item.role).filter(Boolean);

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}

      <div
        className={`
          flex h-[76px] shrink-0 items-center
          border-b border-zinc-100
          ${compact ? "justify-center px-2" : "px-5"}
        `}
      >
        <Link
          href="/account"
          onClick={onNavigate}
          className="flex items-center gap-3"
          title="Dashboard"
        >
          <div
            className="
              flex h-9 w-9 shrink-0 items-center
              justify-center rounded-xl bg-black text-white
            "
          >
            <LayoutDashboard size={19} strokeWidth={2} />
          </div>

          {!compact && (
            <div className="min-w-0">
              <div className="text-[15px] font-semibold tracking-tight text-black">
                Dashboard
              </div>
              <div className="text-[11px] text-zinc-400">
                Personal workspace
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* User selector */}

      <div className="px-3 pt-5">
        <button
          type="button"
          aria-expanded={accountOpen}
          aria-label="Toggle account details"
          onClick={() => setAccountOpen((value) => !value)}
          className={`
            flex w-full items-center rounded-xl
            border border-zinc-200 bg-white
            text-left transition-colors hover:bg-zinc-50
            ${compact ? "justify-center p-2" : "gap-2.5 p-2.5"}
          `}
        >
          <UserAvatar user={user} size="sm" />

          {!compact && (
            <>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-black">
                  {displayName}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-zinc-500">
                  {user.email}
                </div>
              </div>

              <ChevronDown
                size={15}
                className={`
                  shrink-0 text-zinc-400 transition-transform
                  ${accountOpen ? "rotate-180" : ""}
                `}
              />
            </>
          )}
        </button>

        <AnimatePresence initial={false}>
          {accountOpen && !compact && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-3">
                <p className="text-[11px] text-zinc-400">ACCOUNT ROLE</p>

                <p className="mt-1 text-xs font-medium capitalize text-black">
                  {roleLabels.length ? roleLabels.join(", ") : "Member"}
                </p>

                <div className="my-3 h-px bg-zinc-100" />

                <Link
                  href="/account/profile"
                  onClick={onNavigate}
                  className="flex items-center justify-between text-xs text-zinc-600 hover:text-black"
                >
                  View profile
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}

      <nav
        aria-label="Dashboard navigation"
        className="mt-6 flex-1 space-y-7 overflow-y-auto px-3 pb-5"
      >
        {navigation.map((section) => (
          <div key={section.title}>
            {!compact && (
              <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.12em] text-zinc-400">
                {section.title}
              </p>
            )}

            {compact && <div className="mx-3 mb-3 border-t border-zinc-200" />}

            <div className="space-y-1">
              {section.items.map((item) => (
                <NavigationItem
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                  compact={compact}
                  badge={
                    item.href === "/account/addresses"
                      ? user.addressCount
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar footer */}

      <div className="shrink-0 border-t border-zinc-100 p-3">
        {!compact && (
          <Link
            href="/account"
            onClick={onNavigate}
            className="
              flex h-10 items-center gap-3 rounded-xl
              px-3 text-sm text-zinc-600
              transition-colors hover:bg-zinc-100
              hover:text-black
            "
          >
            <CircleHelp size={18} />
            <span>Help & support</span>
            <ChevronRight size={15} className="ml-auto text-zinc-400" />
          </Link>
        )}

        <form action={logoutAction}>
          <button
            type="submit"
            title="Log out"
            className={`
              mt-1 flex h-10 w-full items-center
              rounded-xl text-sm text-zinc-600
              transition-colors hover:bg-zinc-100
              hover:text-black
              ${compact ? "justify-center px-2" : "gap-3 px-3"}
            `}
          >
            <LogOut size={18} />

            {!compact && <span>Log out</span>}
          </button>
        </form>

        {!compact && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-50 p-2">
            <UserAvatar user={user} size="sm" />

            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-black">
                {displayName}
              </div>
              <div className="truncate text-[10px] text-zinc-500">
                {user.email}
              </div>
            </div>

            <span
              className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
              title="Signed in"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------
// Main dashboard
// --------------------------------------------------

export default function DashboardShell({ user, children, logoutAction }) {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Desktop sidebar */}

      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? 76 : 264,
        }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 35,
        }}
        className="
          fixed inset-y-0 left-0 z-40 hidden
          overflow-hidden border-r border-zinc-200
          bg-white lg:block
        "
      >
        <div className="h-full min-w-0">
          <SidebarContent
            user={user}
            pathname={pathname}
            logoutAction={logoutAction}
            compact={sidebarCollapsed}
          />
        </div>
      </motion.aside>

      {/* Mobile drawer */}

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="
                fixed inset-0 z-50 bg-black/40
                backdrop-blur-[2px] lg:hidden
              "
            />

            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{
                type: "spring",
                stiffness: 340,
                damping: 35,
              }}
              className="
                fixed inset-y-0 left-0 z-50
                w-[min(300px,85vw)] border-r
                border-zinc-200 bg-white lg:hidden
              "
            >
              <SidebarContent
                user={user}
                pathname={pathname}
                logoutAction={logoutAction}
                onNavigate={() => setMobileOpen(false)}
              />

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="
                  absolute right-3 top-5 rounded-lg
                  p-2 text-zinc-500 hover:bg-zinc-100
                "
              >
                <X size={18} />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main page */}

      <motion.div
        initial={false}
        animate={{
          paddingLeft: sidebarCollapsed ? 76 : 264,
        }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 35,
        }}
        className="
          min-h-screen w-full !pl-0
          lg:!pl-[var(--sidebar-width)]
        "
        style={{
          "--sidebar-width": sidebarCollapsed ? "76px" : "264px",
        }}
      >
        {/* Top header */}

        <header
          className="
            sticky w-full top-0 z-30 flex h-[76px]
            items-center justify-between
            border-b border-zinc-200
            bg-white/95 px-4 backdrop-blur-xl
            sm:px-6 lg:px-8
          "
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="
                flex h-9 w-9 items-center justify-center
                rounded-xl border border-zinc-200
                text-zinc-600 hover:bg-zinc-50
                lg:hidden
              "
            >
              <Menu size={19} />
            </button>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((value) => !value)}
              aria-label={
                sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              className="
                hidden h-9 w-9 items-center
                justify-center rounded-xl
                text-zinc-500 hover:bg-zinc-100
                lg:flex
              "
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>

            <div className="hidden h-5 w-px bg-zinc-200 lg:block" />

            <div className="flex min-w-0 items-center gap-2 text-sm">
              <Link
                href="/account"
                className="hidden text-zinc-400 hover:text-black sm:block"
              >
                Workspace
              </Link>

              <ChevronRight
                size={14}
                className="hidden text-zinc-300 sm:block"
              />

              <span className="truncate font-medium text-black">
                {pageTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="
                hidden rounded-full border
                border-zinc-200 px-3 py-1.5
                text-xs text-zinc-600 md:inline-flex
              "
            >
              My account
            </span>

            <Link
              href="/account/profile"
              aria-label="View profile"
              className="
                rounded-full p-0.5
                ring-offset-2 transition-shadow
                hover:ring-2 hover:ring-zinc-200
              "
            >
              <UserAvatar user={user} size="sm" />
            </Link>
          </div>
        </header>

        {/* Dashboard content */}

        <main className="min-h-[calc(100vh-76px)]">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
            {children}
          </div>
        </main>
      </motion.div>
    </div>
  );
}
