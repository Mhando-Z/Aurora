"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const AUTOPLAY_MS = 5000;

export default function HeroCarousel({ slides = [] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovering, setIsHovering] = useState(false);
  const timerRef = useRef(null);

  const count = slides.length;

  const goTo = useCallback(
    (nextIndex, dir = 1) => {
      setDirection(dir);
      setIndex(((nextIndex % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => goTo(index + 1, 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1, -1), [index, goTo]);

  // Autoplay, paused on hover
  useEffect(() => {
    if (count <= 1 || isHovering) return;
    timerRef.current = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [next, count, isHovering]);

  if (!count) return null;

  const slide = slides[index];

  return (
    <div className="mx-auto mb-5 ">
      <div
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="relative"
      >
        {/* Peek wrapper: padding reveals slivers of neighbor slides on both sides */}
        <div className="overflow-hidden rounded-3xl px-2">
          <div className="relative h-[220px] sm:h-[280px] md:h-[340px]">
            <AnimatePresence
              initial={false}
              custom={direction}
              mode="popLayout"
            >
              <motion.div
                key={index}
                custom={direction}
                initial={{
                  x: direction > 0 ? "8%" : "-8%",
                  opacity: 0,
                  scale: 0.97,
                }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{
                  x: direction > 0 ? "-8%" : "8%",
                  opacity: 0,
                  scale: 0.97,
                }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) next();
                  else if (info.offset.x > 60) prev();
                }}
                className="absolute inset-0 cursor-grab overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm active:cursor-grabbing"
              >
                <div
                  draggable={false}
                  className="grid h-full grid-cols-1 sm:grid-cols-2"
                >
                  {/* Text side */}
                  <div className="flex flex-col justify-center gap-2 px-6 py-6 sm:px-10">
                    {slide.eyebrow && (
                      <span className="text-xs font-medium uppercase tracking-wide text-black/50">
                        {slide.eyebrow}
                      </span>
                    )}
                    <h2 className="text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
                      {slide.title}
                    </h2>
                    {slide.subtitle && (
                      <p className="line-clamp-2 text-sm text-black/60 sm:text-base">
                        {slide.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Image side */}
                  <div className="relative hidden bg-black/4 sm:block">
                    {slide.image && (
                      <motion.img
                        src={slide?.image}
                        alt={slide.title || ""}
                        draggable={false}
                        className="object-conver w-full h-full"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mt-4 flex px-2 items-center justify-between">
        {/* Arrows */}
        {count > 1 && (
          <div className="flex flex-row gap-2 items-center">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white/90 shadow-sm backdrop-blur transition hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white/90 shadow-sm backdrop-blur transition hover:bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Dots */}
        {count > 1 && (
          <div className="flex items-center justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i, i > index ? 1 : -1)}
                className="relative h-1.5 rounded-full bg-black/15 transition-all"
                style={{ width: i === index ? 20 : 6 }}
              >
                {i === index && (
                  <motion.span
                    layoutId="carousel-dot"
                    className="absolute inset-0 rounded-full bg-black"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
