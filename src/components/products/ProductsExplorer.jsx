"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  PackageX,
  ChevronDown,
} from "lucide-react";
import ProductCard from "@/components/products/ProductCard";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
];

export default function ProductsExplorer({ products }) {
  const [query, setQuery] = useState("");
  const [condition, setCondition] = useState("all");
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const conditions = useMemo(() => {
    const set = new Set(products.map((p) => p.condition).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const matchesQuery = p.title
        ?.toLowerCase()
        .includes(query.trim().toLowerCase());
      const matchesCondition = condition === "all" || p.condition === condition;
      const price = Number(p.price ?? 0);
      const matchesMin = minPrice === "" || price >= Number(minPrice);
      const matchesMax = maxPrice === "" || price <= Number(maxPrice);
      return matchesQuery && matchesCondition && matchesMin && matchesMax;
    });

    switch (sort) {
      case "price-asc":
        result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        result = [...result].sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "name-asc":
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        // "newest" — already ordered by published_at from the query
        break;
    }

    return result;
  }, [products, query, condition, sort, minPrice, maxPrice]);

  const hasActiveFilters =
    query !== "" || condition !== "all" || minPrice !== "" || maxPrice !== "";

  function clearFilters() {
    setQuery("");
    setCondition("all");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
  }

  if (!products.length) {
    return (
      <div className="rounded-3xl border border-dashed border-black/15 bg-white p-10 text-center text-black/55">
        No published products yet.
      </div>
    );
  }

  return (
    <div>
      {/* Search + controls bar */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parts…"
            className="w-full rounded-2xl border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-black/30"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none rounded-2xl border border-black/10 bg-white py-2.5 pl-9 pr-8 text-sm outline-none transition focus:border-black/30"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          </div>

          {/* Filters toggle (mobile-friendly) */}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
              filtersOpen
                ? "border-black/30 bg-black/[0.04]"
                : "border-black/10 bg-white"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-2xl border border-black/10 bg-white px-3 py-2.5 text-sm text-black/55 transition hover:text-black"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expandable filter panel */}
      <AnimatePresence initial={false}>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-black/10 bg-white p-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase text-black/50">
                  Condition
                </label>
                <div className="flex flex-wrap gap-2">
                  {conditions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCondition(c)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                        condition === c
                          ? "border-black bg-black text-white"
                          : "border-black/10 text-black/60 hover:border-black/30"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase text-black/50">
                  Min Price
                </label>
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase text-black/50">
                  Max Price
                </label>
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Any"
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mb-4 text-xs text-black/45">
        {filtered.length} {filtered.length === 1 ? "result" : "results"}
      </p>

      {/* Grid */}
      {filtered.length ? (
        <motion.div
          layout
          className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <ProductCard product={product} priority={index < 4} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-black/15 bg-white p-10 text-center text-black/55">
          <PackageX className="h-8 w-8 text-black/30" />
          <p>No parts match your filters.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium underline underline-offset-2"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
