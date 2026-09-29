"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionTemplate,
  useSpring,
} from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
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
// Routes (single source of truth)
// NOTE: the original file mixed /dashboard/* and /account/* paths.
// Adjust these in one place to match your real routes.
// --------------------------------------------------

const ROUTES = {
  overview: "/dashboard",
  profile: "/dashboard/account",
  addresses: "/account/addresses",
  security: "/account/security",
  settings: "/account/settings",
  support: "/account",
};

const HEADER_HEIGHT = 76;
const SIDEBAR_EXPANDED = 264;
const SIDEBAR_COLLAPSED = 76;

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2";

// --------------------------------------------------
// Navigation configuration
// --------------------------------------------------

const navigation = [
  {
    title: "WORKSPACE",
    items: [
      {
        label: "Overview",
        href: ROUTES.overview,
        icon: LayoutDashboard,
        exact: true,
      },
      {
        label: "My profile",
        href: ROUTES.profile,
        icon: UserRound,
      },
      {
        label: "Addresses",
        href: ROUTES.addresses,
        icon: MapPin,
      },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      {
        label: "Security",
        href: ROUTES.security,
        icon: ShieldCheck,
      },
      {
        label: "Settings",
        href: ROUTES.settings,
        icon: Settings2,
      },
    ],
  },
];

const allNavItems = navigation.flatMap((section) => section.items);

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

// Derived from the navigation config so the title can never drift
// out of sync with the sidebar's active state.
function getPageTitle(pathname) {
  const match = allNavItems
    .filter((item) => isActivePath(pathname, item))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return match?.label ?? "Account";
}

function isAdminRole(role) {
  return String(role).toLowerCase().includes("admin");
}

// --------------------------------------------------
// Verified badge (soft blurred glow + check)
// --------------------------------------------------

function VerifiedBadge() {
  return (
    <span
      className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center"
      title="Verified admin"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-black/25 blur-[5px]"
      />
      <BadgeCheck
        size={16}
        strokeWidth={2}
        aria-hidden="true"
        className="relative fill-blue-600 text-white"
      />
      <span className="sr-only">Verified</span>
    </span>
  );
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

function NavigationItem({
  item,
  pathname,
  onNavigate,
  badge,
  compact,
  indicatorId,
}) {
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
        ${FOCUS_RING}
        ${compact ? "justify-center px-2" : "gap-3 px-3"}
        ${
          active
            ? "bg-black font-medium text-white"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
        }
      `}
    >
      <Icon size={18} strokeWidth={active ? 2.1 : 1.8} className="shrink-0" />

      {compact && <span className="sr-only">{item.label}</span>}

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
              layoutId={indicatorId}
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
  variant = "desktop",
}) {
  const [accountOpen, setAccountOpen] = useState(false);

  const displayName =
    user.fullName || user.email?.split("@")[0] || "My account";

  const roleLabels = (user.roles ?? [])
    .map((item) => item?.role)
    .filter(Boolean);

  const avatarWithStatus = (
    <span className="relative shrink-0">
      <UserAvatar user={user} size="sm" />
      <span
        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
        title="Signed in"
      />
    </span>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}

      <div
        className={`
          flex shrink-0 items-center
          border-b border-zinc-100
          ${compact ? "justify-center px-2" : "px-5"}
        `}
        style={{ height: HEADER_HEIGHT }}
      >
        <Link
          href={ROUTES.overview}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-xl ${FOCUS_RING}`}
          title="Dashboard"
        >
          <div
            className="
              flex h-12 w-12 bg-white shadow-sm border border-gray-300 shrink-0 items-center
              justify-center rounded-xl 
            "
          >
            <motion.img
              src={
                "https://gdagjlvlwmagvonhepsc.supabase.co/storage/v1/object/public/Assets/logos/Aurora.png"
              }
              className="object-cover"
            />
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
        {compact ? (
          // Collapsed: there is no room for the details panel,
          // so the avatar links straight to the profile instead of a dead toggle.
          <Link
            href={ROUTES.profile}
            onClick={onNavigate}
            title={`${displayName} – view profile`}
            aria-label={`${displayName} – view profile`}
            className={`
              flex w-full items-center justify-center rounded-xl
              border border-zinc-200 bg-white p-2
              transition-colors hover:bg-zinc-50
              ${FOCUS_RING}
            `}
          >
            {avatarWithStatus}
          </Link>
        ) : (
          <button
            type="button"
            aria-expanded={accountOpen}
            aria-controls={`account-details-${variant}`}
            aria-label="Toggle account details"
            onClick={() => setAccountOpen((value) => !value)}
            className={`
              flex w-full items-center gap-2.5 rounded-xl
              border border-zinc-200 bg-white p-2.5
              text-left transition-colors hover:bg-zinc-50
              ${FOCUS_RING}
            `}
          >
            {avatarWithStatus}

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
          </button>
        )}

        <AnimatePresence initial={false}>
          {accountOpen && !compact && (
            <motion.div
              id={`account-details-${variant}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-3">
                <p className="text-[11px] text-zinc-400">ACCOUNT ROLE</p>

                <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1">
                  {roleLabels.length ? (
                    roleLabels.map((role, index) => (
                      <span
                        key={`${role}-${index}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium capitalize text-black"
                      >
                        {isAdminRole(role) && (
                          <div className="flex items-center gap-2">
                            <p>Admin</p>
                            <VerifiedBadge />
                          </div>
                        )}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-medium text-black">
                      Member
                    </span>
                  )}
                </div>

                <div className="my-3 h-px bg-zinc-100 hidden" />

                <Link
                  href={ROUTES.profile}
                  onClick={onNavigate}
                  className={` items-center hidden justify-between rounded-md text-xs text-zinc-600 hover:text-black ${FOCUS_RING}`}
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
                  indicatorId={`${variant}-active-indicator`}
                  badge={
                    item.href === ROUTES.addresses
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
            href={ROUTES.support}
            onClick={onNavigate}
            className={`
              flex h-10 items-center gap-3 rounded-xl
              px-3 text-sm text-zinc-600
              transition-colors hover:bg-zinc-100
              hover:text-black
              ${FOCUS_RING}
            `}
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
              ${FOCUS_RING}
              ${compact ? "justify-center px-2" : "gap-3 px-3"}
            `}
          >
            <LogOut size={18} />

            {compact ? (
              <span className="sr-only">Log out</span>
            ) : (
              <span>Log out</span>
            )}
          </button>
        </form>
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

  // One spring drives the sidebar width, the fixed header offset and the
  // content padding, so all three move in perfect sync.
  const sidebarWidth = useSpring(SIDEBAR_EXPANDED, {
    stiffness: 320,
    damping: 35,
  });
  const sidebarWidthVar = useMotionTemplate`${sidebarWidth}px`;

  useEffect(() => {
    sidebarWidth.set(sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED);
  }, [sidebarCollapsed, sidebarWidth]);

  // Close the drawer after navigating.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Drawer: Escape to close + lock background scroll while open.
  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className="min-h-screen bg-white text-black"
        style={{ "--sidebar-width": sidebarWidthVar }}
      >
        {/* Desktop sidebar */}

        <motion.aside
          style={{ width: sidebarWidth }}
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
              variant="desktop"
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
                aria-hidden="true"
                className="
                  fixed inset-0 z-50 bg-black/40
                  backdrop-blur-[2px] lg:hidden
                "
              />

              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
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
                  variant="mobile"
                />

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation"
                  className={`
                    absolute right-3 top-5 rounded-lg
                    p-2 text-zinc-500 hover:bg-zinc-100
                    ${FOCUS_RING}
                  `}
                >
                  <X size={18} />
                </button>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Fixed top header */}

        <header
          className="
            fixed inset-x-0 top-0 z-30 flex h-[76px]
            items-center justify-between
            border-b border-zinc-200
            bg-white/95 px-4 backdrop-blur-xl
            sm:px-6 lg:left-[var(--sidebar-width)] lg:px-8
          "
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              className={`
                flex h-9 w-9 items-center justify-center
                rounded-xl border border-zinc-200
                text-zinc-600 hover:bg-zinc-50
                lg:hidden
                ${FOCUS_RING}
              `}
            >
              <Menu size={19} />
            </button>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((value) => !value)}
              aria-label={
                sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              className={`
                hidden h-9 w-9 items-center
                justify-center rounded-xl
                text-zinc-500 hover:bg-zinc-100
                lg:flex
                ${FOCUS_RING}
              `}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>

            <div className="hidden h-5 w-px bg-zinc-200 lg:block" />

            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-2 text-sm"
            >
              <Link
                href={ROUTES.overview}
                className={`hidden rounded-md text-zinc-400 hover:text-black sm:block ${FOCUS_RING}`}
              >
                Workspace
              </Link>

              <ChevronRight
                size={14}
                aria-hidden="true"
                className="hidden text-zinc-300 sm:block"
              />

              <span
                aria-current="page"
                className="truncate font-medium text-black"
              >
                {pageTitle}
              </span>
            </nav>
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
              href={ROUTES.profile}
              aria-label="View profile"
              className={`
                rounded-full p-0.5
                ring-offset-2 transition-shadow
                hover:ring-2 hover:ring-zinc-200
                ${FOCUS_RING}
              `}
            >
              <UserAvatar user={user} size="sm" />
            </Link>
          </div>
        </header>

        {/* Dashboard content (offset for the fixed header + sidebar) */}

        <div className="min-h-screen w-full pt-[76px] lg:pl-[var(--sidebar-width)]">
          <main className="min-h-[calc(100vh-76px)]">
            <div className="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
              {children}
            </div>
          </main>
        </div>
      </motion.div>
    </MotionConfig>
  );
}
