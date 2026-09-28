"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Edit3,
  House,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  MapPinned,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const EMPTY_ADDRESS = {
  label: "Home",
  recipient_name: "",
  phone: "",
  region: "",
  district: "",
  ward: "",
  street: "",
  landmark: "",
  postal_code: "",
  additional_info: "",
  is_default: false,
};

const ADDRESS_FIELDS = [
  "label",
  "recipient_name",
  "phone",
  "region",
  "district",
  "ward",
  "street",
  "landmark",
  "postal_code",
  "additional_info",
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function formatDate(date) {
  if (!date) return "Unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Unavailable";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getInitials(name, email) {
  const value = name?.trim() || email || "AU";

  return value
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function formatAddress(address) {
  return [address.street, address.ward, address.district, address.region]
    .filter(Boolean)
    .join(", ");
}

function SectionHeading({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-gray-50">
          <Icon className="h-5 w-5 text-gray-700" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, missing }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 text-gray-400">
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500">{label}</p>

        <p
          className={`mt-1 break-words text-sm font-medium ${
            missing ? "text-gray-400" : "text-gray-900"
          }`}
        >
          {value || "Not provided"}
        </p>
      </div>

      {missing && (
        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
          Missing
        </span>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  textarea = false,
}) {
  const className =
    "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100";

  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${className} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          className={className}
        />
      )}
    </label>
  );
}

export default function AccountClient({
  userId,
  email,
  initialProfile,
  initialRoles,
  initialAddresses,
  logoutAction,
}) {
  const [profile, setProfile] = useState(initialProfile || {});

  const [addresses, setAddresses] = useState(initialAddresses);

  const [editingProfile, setEditingProfile] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: initialProfile?.full_name || "",
    phone: initialProfile?.phone || "",
  });

  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);

  const [editingAddressId, setEditingAddressId] = useState(null);

  const [showAddressForm, setShowAddressForm] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);

  const [savingAddress, setSavingAddress] = useState(false);

  const [busyAddressId, setBusyAddressId] = useState(null);

  const [notice, setNotice] = useState(null);

  const isAdmin = initialRoles.some(
    ({ role }) => role?.toLowerCase() === "admin",
  );

  const roleLabel = isAdmin
    ? "Administrator"
    : initialRoles
        .map(({ role }) => role)
        .filter(Boolean)
        .join(", ") || "Customer";

  const defaultAddress = addresses.find((address) => address.is_default);

  /*
   * Completion is advisory only.
   *
   * Email is already supplied by authentication.
   * A usable delivery address requires a recipient,
   * contact number and region.
   */
  const completion = useMemo(() => {
    const hasAddress = addresses.some(
      (address) =>
        address.recipient_name?.trim() &&
        address.phone?.trim() &&
        address.region?.trim(),
    );

    const items = [
      {
        id: "name",
        label: "Add your full name",
        completed: Boolean(profile.full_name?.trim()),
        target: "profile",
      },
      {
        id: "email",
        label: "Email address available",
        completed: Boolean(email),
        target: null,
      },
      {
        id: "phone",
        label: "Add your phone number",
        completed: Boolean(profile.phone?.trim()),
        target: "profile",
      },
      {
        id: "address",
        label: "Add a delivery address",
        completed: Boolean(hasAddress),
        target: "address",
      },
    ];

    const completed = items.filter((item) => item.completed).length;

    return {
      items,
      completed,
      total: items.length,
      percentage: Math.round((completed / items.length) * 100),
    };
  }, [profile, email, addresses]);

  function notify(message, type = "success") {
    setNotice({ message, type });
  }

  function cancelProfileEdit() {
    setProfileForm({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
    });

    setEditingProfile(false);
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (savingProfile) return;

    setSavingProfile(true);
    setNotice(null);

    try {
      const payload = {
        full_name: profileForm.full_name.trim() || null,
        phone: profileForm.phone.trim() || null,
      };

      const { data, error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", userId)
        .select("full_name, phone")
        .single();

      if (error) throw error;

      setProfile((previous) => ({
        ...previous,
        ...data,
      }));

      setEditingProfile(false);
      notify("Your profile has been updated.");
    } catch (error) {
      notify(error.message || "Unable to update your profile.", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  function openNewAddress() {
    setEditingAddressId(null);

    setAddressForm({
      ...EMPTY_ADDRESS,
      recipient_name: profile.full_name || "",
      phone: profile.phone || "",
      is_default: addresses.length === 0,
    });

    setShowAddressForm(true);
    setNotice(null);
  }

  function openEditAddress(address) {
    setEditingAddressId(address.id);

    setAddressForm(
      Object.fromEntries(
        Object.keys(EMPTY_ADDRESS).map((key) => [
          key,
          address[key] ?? EMPTY_ADDRESS[key],
        ]),
      ),
    );

    setShowAddressForm(true);
    setNotice(null);
  }

  function closeAddressForm() {
    if (savingAddress) return;

    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm(EMPTY_ADDRESS);
  }

  function updateAddressField(field, value) {
    setAddressForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function refreshAddresses() {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    setAddresses(data || []);

    return data || [];
  }

  async function saveAddress(event) {
    event.preventDefault();

    if (savingAddress) return;

    setSavingAddress(true);
    setNotice(null);

    try {
      const now = new Date().toISOString();

      const payload = Object.fromEntries(
        ADDRESS_FIELDS.map((field) => [
          field,
          typeof addressForm[field] === "string"
            ? addressForm[field].trim() || null
            : addressForm[field],
        ]),
      );

      if (!payload.recipient_name || !payload.phone || !payload.region) {
        throw new Error("Recipient name, phone and region are required.");
      }

      // A default is set separately after saving.
      payload.is_default = false;
      payload.updated_at = now;

      let savedId;

      if (editingAddressId) {
        const { data, error } = await supabase
          .from("addresses")
          .update(payload)
          .eq("id", editingAddressId)
          .eq("user_id", userId)
          .select("id")
          .single();

        if (error) throw error;

        savedId = data.id;
      } else {
        const { data, error } = await supabase
          .from("addresses")
          .insert({
            ...payload,
            id: crypto.randomUUID(),
            user_id: userId,
            created_at: now,
          })
          .select("id")
          .single();

        if (error) throw error;

        savedId = data.id;
      }

      /*
       * Preserve the current default unless the user
       * explicitly chooses another one.
       */
      const shouldBeDefault =
        addressForm.is_default || (!defaultAddress && addresses.length === 0);

      if (shouldBeDefault) {
        // First unset the user's other defaults.
        const { error: clearError } = await supabase
          .from("addresses")
          .update({
            is_default: false,
            updated_at: now,
          })
          .eq("user_id", userId)
          .neq("id", savedId)
          .eq("is_default", true);

        if (clearError) throw clearError;

        const { error: setError } = await supabase
          .from("addresses")
          .update({
            is_default: true,
            updated_at: now,
          })
          .eq("id", savedId)
          .eq("user_id", userId);

        if (setError) throw setError;
      } else if (editingAddressId && defaultAddress?.id === editingAddressId) {
        // Editing the existing default should preserve it.
        const { error } = await supabase
          .from("addresses")
          .update({
            is_default: true,
            updated_at: now,
          })
          .eq("id", savedId)
          .eq("user_id", userId);

        if (error) throw error;
      }

      await refreshAddresses();

      setShowAddressForm(false);
      setEditingAddressId(null);
      setAddressForm(EMPTY_ADDRESS);

      notify(
        editingAddressId
          ? "Delivery address updated."
          : "Delivery address added.",
      );
    } catch (error) {
      notify(error.message || "Unable to save address.", "error");

      // Refresh in case saving succeeded but setting
      // the default address failed.
      try {
        await refreshAddresses();
      } catch {
        // Retain the existing display.
      }
    } finally {
      setSavingAddress(false);
    }
  }

  async function makeDefault(addressId) {
    if (busyAddressId) return;

    setBusyAddressId(addressId);
    setNotice(null);

    try {
      const now = new Date().toISOString();

      const { error: clearError } = await supabase
        .from("addresses")
        .update({
          is_default: false,
          updated_at: now,
        })
        .eq("user_id", userId)
        .eq("is_default", true);

      if (clearError) throw clearError;

      const { error: setError } = await supabase
        .from("addresses")
        .update({
          is_default: true,
          updated_at: now,
        })
        .eq("user_id", userId)
        .eq("id", addressId);

      if (setError) throw setError;

      await refreshAddresses();

      notify("Default delivery address updated.");
    } catch (error) {
      notify(error.message || "Unable to change default address.", "error");

      try {
        await refreshAddresses();
      } catch {
        // Retain the existing display.
      }
    } finally {
      setBusyAddressId(null);
    }
  }

  async function deleteAddress(addressId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this delivery address?",
    );

    if (!confirmed || busyAddressId) return;

    setBusyAddressId(addressId);
    setNotice(null);

    try {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addressId)
        .eq("user_id", userId);

      if (error) throw error;

      const remaining = await refreshAddresses();

      // If the default was deleted, automatically
      // select another saved address.
      if (defaultAddress?.id === addressId && remaining.length > 0) {
        const nextAddress = remaining[0];

        const { error: defaultError } = await supabase
          .from("addresses")
          .update({
            is_default: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", nextAddress.id)
          .eq("user_id", userId);

        if (defaultError) throw defaultError;

        await refreshAddresses();
      }

      notify("Delivery address deleted.");
    } catch (error) {
      notify(error.message || "Unable to delete address.", "error");

      try {
        await refreshAddresses();
      } catch {
        // Retain the existing display.
      }
    } finally {
      setBusyAddressId(null);
    }
  }

  function goToMissingDetail(target) {
    if (target === "profile") {
      setEditingProfile(true);

      document.getElementById("profile-section")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    if (target === "address") {
      openNewAddress();

      document.getElementById("address-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl xl:px-6 px-4 py-8 sm:px-6 sm:py-12">
        {/* Page heading */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.35 }}
          className="mb-8"
        >
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
            <House size={15} />

            <ChevronRight size={14} />

            <span className="font-medium text-gray-900">My account</span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                My account
              </h1>

              <p className="mt-2 text-sm text-gray-600">
                Manage your Aurora account and delivery details.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-500">
              <CalendarDays size={14} />
              Member since {formatDate(profile.created_at)}
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {notice && (
            <motion.div
              key={notice.message}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              role="status"
              className={`mb-6 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                notice.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {notice.type === "error" ? (
                  <Circle size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}

                <span>{notice.message}</span>
              </div>

              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Identity card */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white"
        >
          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile avatar"
                    className="h-20 w-20 rounded-2xl border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 text-2xl font-bold text-gray-700">
                    {getInitials(profile.full_name, email)}
                  </div>
                )}

                <div className="absolute -bottom-2 -right-2 rounded-full border-2 border-white bg-gray-900 p-1.5 text-white">
                  <UserRound size={13} />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="break-words text-xl font-bold text-gray-900 sm:text-2xl">
                    {profile.full_name || "Aurora customer"}
                  </h2>

                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                      <BadgeCheck
                        size={16}
                        className="fill-blue-600 text-white"
                      />
                      Admin
                    </span>
                  )}
                </div>

                <p className="mt-1 break-all text-sm text-gray-500">
                  {email || "Email unavailable"}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    <ShieldCheck size={13} />
                    {roleLabel}
                  </span>

                  <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
                    {completion.percentage === 100
                      ? "Profile complete"
                      : "Profile incomplete"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => goToMissingDetail("profile")}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Edit3 size={15} />
                Edit profile
              </button>
            </div>
          </div>

          {/* Completion indicator */}
          <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-5 sm:px-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Profile completion
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Complete your details for a faster checkout.
                </p>
              </div>

              <motion.span
                key={completion.percentage}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-2xl font-bold tabular-nums text-gray-900"
              >
                {completion.percentage}%
              </motion.span>
            </div>

            <div
              role="progressbar"
              aria-label="Profile completion"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completion.percentage}
              className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-200"
            >
              <motion.div
                initial={{
                  width: `${completion.percentage}%`,
                }}
                animate={{
                  width: `${completion.percentage}%`,
                }}
                transition={{
                  duration: 0.6,
                  ease: "easeOut",
                }}
                className="h-full rounded-full bg-gray-900"
              />
            </div>

            <p className="mt-3 text-xs text-gray-500">
              {completion.percentage === 100
                ? "Your profile is ready for a smoother shopping experience."
                : `${completion.completed} of ${completion.total} recommended details completed. You can complete the rest anytime.`}
            </p>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Profile details */}
            <motion.section
              id="profile-section"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ delay: 0.1 }}
              className="scroll-mt-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7"
            >
              <SectionHeading
                icon={UserRound}
                title="Personal information"
                description="Your basic account details."
                action={
                  !editingProfile && (
                    <button
                      type="button"
                      onClick={() => setEditingProfile(true)}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      <Edit3 size={15} />
                      Edit
                    </button>
                  )
                }
              />

              <AnimatePresence mode="wait">
                {editingProfile ? (
                  <motion.form
                    key="profile-form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    onSubmit={saveProfile}
                    className="mt-6 space-y-5"
                  >
                    <TextField
                      label="Full name"
                      value={profileForm.full_name}
                      onChange={(value) =>
                        setProfileForm((previous) => ({
                          ...previous,
                          full_name: value,
                        }))
                      }
                      placeholder="Enter your full name"
                    />

                    <TextField
                      label="Phone number"
                      type="tel"
                      value={profileForm.phone}
                      onChange={(value) =>
                        setProfileForm((previous) => ({
                          ...previous,
                          phone: value,
                        }))
                      }
                      placeholder="+255 7XX XXX XXX"
                    />

                    <div className="flex flex-wrap justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={cancelProfileEdit}
                        disabled={savingProfile}
                        className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                      >
                        {savingProfile ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                        Save changes
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="profile-details"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-5 grid grid-cols-1 gap-x-8 sm:grid-cols-2"
                  >
                    <DetailItem
                      icon={UserRound}
                      label="Full name"
                      value={profile.full_name}
                      missing={!profile.full_name?.trim()}
                    />

                    <DetailItem
                      icon={Mail}
                      label="Email address"
                      value={email}
                      missing={!email}
                    />

                    <DetailItem
                      icon={Phone}
                      label="Phone number"
                      value={profile.phone}
                      missing={!profile.phone?.trim()}
                    />

                    <DetailItem
                      icon={ShieldCheck}
                      label="Account role"
                      value={roleLabel}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>

            {/* Delivery addresses */}
            <motion.section
              id="address-section"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ delay: 0.15 }}
              className="scroll-mt-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7"
            >
              <SectionHeading
                icon={MapPin}
                title="Delivery addresses"
                description="Save your locations for a quicker checkout."
                action={
                  !showAddressForm && (
                    <button
                      type="button"
                      onClick={openNewAddress}
                      className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                    >
                      <Plus size={16} />
                      Add address
                    </button>
                  )
                }
              />

              <AnimatePresence mode="wait">
                {showAddressForm ? (
                  <motion.form
                    key="address-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={saveAddress}
                    className="mt-7 space-y-5"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {editingAddressId
                          ? "Edit delivery address"
                          : "New delivery address"}
                      </h3>

                      <button
                        type="button"
                        onClick={closeAddressForm}
                        disabled={savingAddress}
                        aria-label="Close address form"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <TextField
                        label="Address label"
                        value={addressForm.label || ""}
                        onChange={(v) => updateAddressField("label", v)}
                        placeholder="Home, Office..."
                      />

                      <TextField
                        label="Recipient name"
                        value={addressForm.recipient_name || ""}
                        onChange={(v) =>
                          updateAddressField("recipient_name", v)
                        }
                        placeholder="Full name"
                        required
                      />

                      <TextField
                        label="Phone number"
                        type="tel"
                        value={addressForm.phone || ""}
                        onChange={(v) => updateAddressField("phone", v)}
                        placeholder="+255 7XX XXX XXX"
                        required
                      />

                      <TextField
                        label="Region"
                        value={addressForm.region || ""}
                        onChange={(v) => updateAddressField("region", v)}
                        placeholder="e.g. Dar es Salaam"
                        required
                      />

                      <TextField
                        label="District"
                        value={addressForm.district || ""}
                        onChange={(v) => updateAddressField("district", v)}
                        placeholder="e.g. Kinondoni"
                      />

                      <TextField
                        label="Ward"
                        value={addressForm.ward || ""}
                        onChange={(v) => updateAddressField("ward", v)}
                        placeholder="e.g. Mikocheni"
                      />

                      <TextField
                        label="Street / Area"
                        value={addressForm.street || ""}
                        onChange={(v) => updateAddressField("street", v)}
                        placeholder="Street or area"
                      />

                      <TextField
                        label="Nearby landmark"
                        value={addressForm.landmark || ""}
                        onChange={(v) => updateAddressField("landmark", v)}
                        placeholder="e.g. Near a shopping mall"
                      />

                      <TextField
                        label="Postal code"
                        value={addressForm.postal_code || ""}
                        onChange={(v) => updateAddressField("postal_code", v)}
                        placeholder="Optional"
                      />
                    </div>

                    <TextField
                      label="Additional delivery instructions"
                      value={addressForm.additional_info || ""}
                      onChange={(v) => updateAddressField("additional_info", v)}
                      placeholder="Anything the delivery team should know..."
                      textarea
                    />

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <input
                        type="checkbox"
                        checked={Boolean(addressForm.is_default)}
                        onChange={(event) =>
                          updateAddressField("is_default", event.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 accent-gray-900"
                      />

                      <span>
                        <span className="block text-sm font-medium text-gray-900">
                          Set as default address
                        </span>

                        <span className="mt-1 block text-xs text-gray-500">
                          Automatically suggest this address during checkout.
                        </span>
                      </span>
                    </label>

                    <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
                      <button
                        type="button"
                        onClick={closeAddressForm}
                        disabled={savingAddress}
                        className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                      >
                        {savingAddress ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                        Save address
                      </button>
                    </div>
                  </motion.form>
                ) : addresses.length === 0 ? (
                  <motion.div
                    key="address-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-7 rounded-xl border border-dashed border-gray-200 px-5 py-10 text-center"
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                      <MapPinned size={25} className="text-gray-500" />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-gray-900">
                      No delivery addresses yet
                    </h3>

                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                      Save an address once and select it when placing your
                      future orders. You can also enter an address directly at
                      checkout.
                    </p>

                    <button
                      type="button"
                      onClick={openNewAddress}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50"
                    >
                      <Plus size={16} />
                      Add your first address
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="addresses-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 space-y-3"
                  >
                    <AnimatePresence initial={false}>
                      {addresses.map((address) => (
                        <motion.div
                          layout
                          key={address.id}
                          initial={{
                            opacity: 0,
                            y: 8,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.98,
                          }}
                          className={`rounded-xl border p-4 transition-colors sm:p-5 ${
                            address.is_default
                              ? "border-gray-300 bg-gray-50/60"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                              <MapPin size={19} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold text-gray-900">
                                  {address.label || "My address"}
                                </h3>

                                {address.is_default && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-2.5 py-1 text-xs font-medium text-white">
                                    <Check size={12} />
                                    Default
                                  </span>
                                )}
                              </div>

                              <p className="mt-3 text-sm font-medium text-gray-900">
                                {address.recipient_name}
                              </p>

                              <p className="mt-1 text-sm leading-6 text-gray-600">
                                {formatAddress(address)}
                              </p>

                              {address.landmark && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Landmark: {address.landmark}
                                </p>
                              )}

                              {address.postal_code && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Postal code: {address.postal_code}
                                </p>
                              )}

                              <p className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600">
                                <Phone size={14} />
                                {address.phone}
                              </p>

                              {address.additional_info && (
                                <p className="mt-2 text-xs leading-5 text-gray-500">
                                  {address.additional_info}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4">
                            {!address.is_default && (
                              <button
                                type="button"
                                disabled={Boolean(busyAddressId)}
                                onClick={() => makeDefault(address.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-50"
                              >
                                {busyAddressId === address.id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={13} />
                                )}
                                Set as default
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={Boolean(busyAddressId)}
                              onClick={() => openEditAddress(address)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                            >
                              <Edit3 size={13} />
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={Boolean(busyAddressId)}
                              onClick={() => deleteAddress(address.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-gray-500">
                <ShieldCheck size={15} className="mt-0.5 shrink-0" />

                <p>
                  Your saved addresses are associated with your account and can
                  be reused when placing orders.
                </p>
              </div>
            </motion.section>

            {/* Account session */}
            <motion.section
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7"
            >
              <SectionHeading
                icon={ShieldCheck}
                title="Account access"
                description="Manage your current account session."
              />

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Sign out of Aurora
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    End your current session securely.
                  </p>
                </div>

                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </form>
              </div>
            </motion.section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Completion checklist */}
            <motion.section
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Account checklist
                </h2>

                <span className="text-xs font-medium tabular-nums text-gray-500">
                  {completion.completed}/{completion.total}
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                A few details help make your shopping experience more
                convenient.
              </p>

              <div className="mt-5 space-y-1">
                {completion.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={item.completed || !item.target}
                    onClick={() => goToMissingDetail(item.target)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors enabled:hover:bg-gray-50 disabled:cursor-default"
                  >
                    {item.completed ? (
                      <CheckCircle2
                        size={19}
                        className="shrink-0 text-green-600"
                      />
                    ) : (
                      <Circle size={19} className="shrink-0 text-gray-300" />
                    )}

                    <span
                      className={`flex-1 text-sm ${
                        item.completed
                          ? "text-gray-500"
                          : "font-medium text-gray-900"
                      }`}
                    >
                      {item.label}
                    </span>

                    {!item.completed && item.target && (
                      <ChevronRight size={15} className="text-gray-400" />
                    )}
                  </button>
                ))}
              </div>

              {completion.percentage === 100 ? (
                <div className="mt-4 rounded-xl bg-green-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                    <CheckCircle2 size={17} />
                    All set!
                  </div>

                  <p className="mt-1 text-xs leading-5 text-green-700">
                    Your recommended account details are complete.
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-gray-50 p-4">
                  <p className="text-xs leading-5 text-gray-600">
                    <span className="font-semibold text-gray-900">
                      Completely optional.
                    </span>{" "}
                    You can shop and place orders without completing your
                    profile.
                  </p>
                </div>
              )}
            </motion.section>

            {/* Default address summary */}
            <motion.section
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="flex items-center gap-2">
                <MapPinned size={18} className="text-gray-700" />

                <h2 className="text-base font-semibold text-gray-900">
                  Preferred delivery
                </h2>
              </div>

              {defaultAddress ? (
                <div className="mt-5">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                    {defaultAddress.label || "Default address"}
                  </span>

                  <p className="mt-4 text-sm font-semibold text-gray-900">
                    {defaultAddress.recipient_name}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    {formatAddress(defaultAddress)}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    {defaultAddress.phone}
                  </p>

                  <button
                    type="button"
                    onClick={() => openEditAddress(defaultAddress)}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:underline"
                  >
                    Manage address
                    <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <div className="mt-5">
                  <p className="text-sm leading-6 text-gray-500">
                    You haven't selected a default delivery address yet.
                  </p>

                  <button
                    type="button"
                    onClick={openNewAddress}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:underline"
                  >
                    Add delivery address
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </motion.section>
          </div>
        </div>
      </div>
    </main>
  );
}
