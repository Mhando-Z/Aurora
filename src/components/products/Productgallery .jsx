"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { PackageSearch } from "lucide-react";

export default function ProductGallery({ images, title }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-3xl bg-white">
        <div className="flex flex-col items-center gap-2 text-black/30">
          <PackageSearch className="h-8 w-8" />
          <p className="text-sm">No photos yet</p>
        </div>
      </div>
    );
  }

  const current = images[active];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Image
              src={current.image_url}
              alt={current.alt_text || title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show photo ${index + 1} of ${images.length}`}
              aria-current={index === active}
              className={`relative aspect-square overflow-hidden rounded-2xl bg-white ring-2 transition-shadow focus-visible:outline-none focus-visible:ring-black/70 ${
                index === active
                  ? "ring-black/70"
                  : "ring-transparent hover:ring-black/15"
              }`}
            >
              <Image
                src={image.image_url}
                alt={image.alt_text || title}
                fill
                sizes="20vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
