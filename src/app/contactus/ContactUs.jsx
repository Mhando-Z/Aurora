"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, ArrowUpRight, Send } from "lucide-react";
import { FaInstagram, FaFacebookF } from "react-icons/fa";

const CONTACTS = [
  {
    label: "Call or WhatsApp",
    value: "0636 693 506",
    href: "https://wa.me/255636693506",
    icon: Phone,
  },
  {
    label: "Email",
    value: "auroraspareparts@gmail.com",
    href: "mailto:auroraspareparts@gmail.com",
    icon: Mail,
  },
  {
    label: "Instagram",
    value: "@Aurora.spareparts",
    href: "https://instagram.com/Aurora.spareparts",
    icon: FaInstagram,
  },
  {
    label: "Facebook",
    value: "Auroraspareparts",
    href: "https://facebook.com/Auroraspareparts",
    icon: FaFacebookF,
  },
];

const MAPS_URL = "https://maps.app.goo.gl/NGvAqiknGePHw65m9";
const MAP_EMBED_SRC =
  "https://www.google.com/maps?q=-6.764039,38.951791&z=16&output=embed";
const EMAIL = "auroraspareparts@gmail.com";

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.15 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function ContactUs() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = `Spare part enquiry from ${form.name || "website visitor"}`;
    const body = `${form.message}\n\n— ${form.name}${form.email ? ` (${form.email})` : ""}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  useEffect(() => {
    if (document.getElementById("aurora-fonts")) return;
    const link = document.createElement("link");
    link.id = "aurora-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);

  return (
    <section
      className="relative overflow-hidden px-6 py-24 md:px-12 lg:px-20"
      style={{ backgroundColor: "#17181A", color: "#F2F0EC" }}
    >
      {/* faint mechanical mark, purely decorative */}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 opacity-[0.06] md:h-96 md:w-96"
      >
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="#F2F0EC"
          strokeWidth="2"
        />
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="#F2F0EC"
          strokeWidth="14"
          strokeDasharray="4 10"
        />
        <circle
          cx="100"
          cy="100"
          r="18"
          fill="none"
          stroke="#F2F0EC"
          strokeWidth="2"
        />
      </svg>

      <div className="relative mx-auto grid max-w-6xl gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
        {/* Left: brand statement + location */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-sm tracking-wide" style={{ color: "#9A9D9F" }}>
            Contact
          </p>

          <h2
            className="mt-3 text-4xl leading-[1.05] sm:text-5xl"
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            Let&apos;s find the part
            <br />
            you need.
          </h2>

          <p
            className="mt-5 max-w-sm text-base leading-relaxed"
            style={{ color: "#B7B9BA" }}
          >
            Reach out by phone, WhatsApp, or social media, or come see us in
            person at our shop in Kibaha.
          </p>

          {/* Location card */}
          <div
            className="mt-10 border p-6"
            style={{ borderColor: "#2E3134", backgroundColor: "#1F2124" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 flex-none items-center justify-center border"
                style={{ borderColor: "#3A3D40" }}
              >
                <MapPin size={20} color="#E85D2D" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm" style={{ color: "#9A9D9F" }}>
                  Visit the shop
                </p>
                <p
                  className="mt-1 text-lg"
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  Kibaha, Picha ya Ndege
                </p>
              </div>
            </div>

            <div
              className="mt-5 h-48 w-full overflow-hidden border"
              style={{ borderColor: "#3A3D40" }}
            >
              <iframe
                title="Aurora Spare Parts location"
                src={MAP_EMBED_SRC}
                width="100%"
                height="100%"
                style={{ border: 0, filter: "grayscale(0.4) contrast(1.05)" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <motion.a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className="mt-4 inline-flex items-center gap-2 border px-4 py-2.5 text-sm"
              style={{ borderColor: "#E85D2D", color: "#F2F0EC" }}
            >
              Get directions
              <ArrowUpRight size={16} />
            </motion.a>
          </div>
        </motion.div>

        {/* Right: contact methods */}
        <motion.div
          variants={listVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="flex flex-col border-t"
          style={{ borderColor: "#2E3134" }}
        >
          {CONTACTS.map(({ label, value, href, icon: Icon }) => (
            <motion.a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              variants={rowVariants}
              whileHover="hover"
              className="group relative flex items-center gap-5 border-b py-6"
              style={{ borderColor: "#2E3134" }}
            >
              <motion.span
                variants={{ hidden: { scaleY: 0 }, hover: { scaleY: 1 } }}
                initial="hidden"
                className="absolute left-0 top-0 h-full w-[3px] origin-top"
                style={{ backgroundColor: "#E85D2D" }}
              />

              <div
                className="flex h-12 w-12 flex-none items-center justify-center border transition-colors duration-200 group-hover:border-[#E85D2D]"
                style={{ borderColor: "#3A3D40" }}
              >
                <Icon size={18} color="#F2F0EC" />
              </div>

              <div className="flex flex-1 flex-col pl-2 sm:flex-row sm:items-baseline sm:justify-between">
                <span className="text-sm" style={{ color: "#9A9D9F" }}>
                  {label}
                </span>
                <span
                  className="mt-1 text-base sm:mt-0"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {value}
                </span>
              </div>

              <ArrowUpRight
                size={18}
                className="flex-none opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                color="#E85D2D"
              />
            </motion.a>
          ))}
        </motion.div>
      </div>

      {/* Direct email form */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto mt-16 max-w-6xl border-t pt-14"
        style={{ borderColor: "#2E3134" }}
      >
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
          <div>
            <h3
              className="text-2xl sm:text-3xl"
              style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600 }}
            >
              Send us a message
            </h3>
            <p
              className="mt-3 max-w-sm text-base leading-relaxed"
              style={{ color: "#B7B9BA" }}
            >
              Tell us which part you're looking for, your vehicle model, or any
              question — it goes straight to our inbox.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="name"
                  className="text-sm"
                  style={{ color: "#9A9D9F" }}
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="border bg-transparent px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-[#E85D2D]"
                  style={{ borderColor: "#3A3D40", color: "#F2F0EC" }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="email"
                  className="text-sm"
                  style={{ color: "#9A9D9F" }}
                >
                  Your email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="border bg-transparent px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-[#E85D2D]"
                  style={{ borderColor: "#3A3D40", color: "#F2F0EC" }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="message"
                className="text-sm"
                style={{ color: "#9A9D9F" }}
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={4}
                value={form.message}
                onChange={handleChange}
                placeholder="e.g. Do you have brake pads for a Toyota Hilux 2015?"
                className="resize-none border bg-transparent px-4 py-3 text-sm outline-none transition-colors duration-200 focus:border-[#E85D2D]"
                style={{ borderColor: "#3A3D40", color: "#F2F0EC" }}
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className="mt-1 inline-flex w-fit items-center gap-2 px-6 py-3 text-sm"
              style={{
                backgroundColor: "#E85D2D",
                color: "#17181A",
                fontWeight: 500,
              }}
            >
              Send message
              <Send size={16} />
            </motion.button>

            {sent && (
              <p className="text-sm" style={{ color: "#9A9D9F" }}>
                Opening your email app now — send it and we'll reply as soon as
                we can.
              </p>
            )}
          </form>
        </div>
      </motion.div>
    </section>
  );
}
