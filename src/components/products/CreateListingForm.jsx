"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ImagePlus,
  Loader2,
  Plus,
  ShieldCheck,
  Tag,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { createClient } from "@/lib/supabase/client";

function getMedian(values) {
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function formatTzs(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";

  return new Intl.NumberFormat("en-TZ", {
    maximumFractionDigits: 0,
  }).format(Number(value));
}

const EMPTY_FORM = {
  sparePartId: "",
  title: "",
  description: "",
  oemPartNumber: "",
  condition: "new",
  price: "",
  quantity: "1",
  isNegotiable: false,
};

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const SECTION_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

/** Native select with a matching custom chevron, since the browser default reads as an afterthought next to the rest of the form. */
function Select({ children, className = "", ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full appearance-none rounded-xl border border-black/15 bg-white px-4 py-3 pr-10 outline-none transition-colors focus:border-black disabled:opacity-50 ${className}`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
    </div>
  );
}

function StepBadge({ index, done }) {
  return (
    <div
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
        done ? "bg-black text-white" : "bg-black/[0.06] text-black/50"
      }`}
    >
      {done ? <Check className="h-3.5 w-3.5" /> : index}
    </div>
  );
}

export default function CreateListingForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const prefersReducedMotion = useReducedMotion();

  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parts, setParts] = useState([]);
  const [guidance, setGuidance] = useState([]);

  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedModels, setSelectedModels] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [titleTouched, setTitleTouched] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [referencePrices, setReferencePrices] = useState([]);
  const [referencePriceLoading, setReferencePriceLoading] = useState(false);
  const [referencePriceError, setReferencePriceError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBaseCatalog() {
      const [brandResult, categoryResult, guidanceResult] = await Promise.all([
        supabase.from("brands").select("id,name,slug").order("name"),
        supabase.from("part_categories").select("id,name,slug").order("name"),
        supabase.from("catalog_guidance").select("key,title,body").order("key"),
      ]);

      const firstError =
        brandResult.error || categoryResult.error || guidanceResult.error;

      if (firstError) {
        toast.error(`Catalog could not be loaded: ${firstError.message}`);
        return;
      }

      if (!cancelled) {
        setBrands(brandResult.data ?? []);
        setCategories(categoryResult.data ?? []);
        setGuidance(guidanceResult.data ?? []);
      }
    }

    loadBaseCatalog();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    setModelId("");
    if (!brandId) {
      setModels([]);
      return;
    }

    supabase
      .from("motorcycle_models")
      .select("id,name,engine_label,motorcycle_type,brand_id")
      .eq("brand_id", brandId)
      .order("name")
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setModels(data ?? []);
      });
  }, [brandId, supabase]);

  useEffect(() => {
    setForm((current) => ({ ...current, sparePartId: "" }));
    if (!categoryId) {
      setParts([]);
      return;
    }

    supabase
      .from("spare_parts")
      .select("id,name,description,category_id")
      .eq("category_id", categoryId)
      .order("name")
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setParts(data ?? []);
      });
  }, [categoryId, supabase]);

  useEffect(() => {
    let cancelled = false;

    async function loadReferencePrices() {
      setReferencePrices([]);
      setReferencePriceError("");

      if (!form.sparePartId || selectedModels.length === 0) {
        setReferencePriceLoading(false);
        return;
      }

      const selectedPart = parts.find(
        (item) => String(item.id) === String(form.sparePartId),
      );

      if (!selectedPart) {
        setReferencePriceLoading(false);
        return;
      }

      const modelNames = [
        ...new Set(selectedModels.map((model) => model.name).filter(Boolean)),
      ];

      if (!modelNames.length) {
        setReferencePriceLoading(false);
        return;
      }

      setReferencePriceLoading(true);

      const { data, error } = await supabase
        .from("catalog_retail_reference_prices")
        .select(
          "source_sku,brand,canonical_model,canonical_spare_part,retail_price,currency,catalogue_mapping",
        )
        .eq("canonical_spare_part", selectedPart.name)
        .eq("catalogue_mapping", "Matched to existing catalogue")
        .in("canonical_model", modelNames);

      if (cancelled) return;

      if (error) {
        setReferencePriceError(
          error.message ||
            "Reference pricing could not be loaded for this selection.",
        );
        setReferencePriceLoading(false);
        return;
      }

      const selectedKeys = new Set(
        selectedModels.map((model) => `${model.brandName}::${model.name}`),
      );

      const matchedRows = (data ?? []).filter((row) =>
        selectedKeys.has(`${row.brand}::${row.canonical_model}`),
      );

      setReferencePrices(matchedRows);
      setReferencePriceLoading(false);
    }

    loadReferencePrices();

    return () => {
      cancelled = true;
    };
  }, [form.sparePartId, parts, selectedModels, supabase]);

  useEffect(() => {
    if (titleTouched || !form.sparePartId || selectedModels.length === 0)
      return;

    const part = parts.find(
      (item) => String(item.id) === String(form.sparePartId),
    );
    const firstModel = selectedModels[0];

    if (!part || !firstModel) return;

    const more = selectedModels.length > 1 ? " + compatible models" : "";
    setForm((current) => ({
      ...current,
      title: `${firstModel.brandName} ${firstModel.name} ${part.name}${more}`,
    }));
  }, [form.sparePartId, parts, selectedModels, titleTouched]);

  // Object URLs are created once per file and revoked when the file leaves
  // the list or the component unmounts, instead of re-creating them on
  // every render.
  useEffect(() => {
    const next = images.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImagePreviews(next);

    return () => {
      next.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [images]);

  const referencePriceSummary = useMemo(() => {
    if (!referencePrices.length) return null;

    const grouped = new Map();

    referencePrices.forEach((row) => {
      const price = Number(row.retail_price);
      if (!Number.isFinite(price) || price <= 0) return;

      const key = `${row.brand}::${row.canonical_model}`;
      const current = grouped.get(key) ?? {
        brand: row.brand,
        model: row.canonical_model,
        currency: row.currency || "TZS",
        prices: [],
      };

      current.prices.push(price);
      grouped.set(key, current);
    });

    const byModel = Array.from(grouped.values())
      .map((item) => ({
        brand: item.brand,
        model: item.model,
        currency: item.currency,
        price: getMedian(item.prices),
      }))
      .filter((item) => Number.isFinite(item.price))
      .sort((a, b) =>
        `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`),
      );

    if (!byModel.length) return null;

    const modelPrices = byModel.map((item) => item.price);

    return {
      currency: byModel[0]?.currency || "TZS",
      suggestedPrice: getMedian(modelPrices),
      minPrice: Math.min(...modelPrices),
      maxPrice: Math.max(...modelPrices),
      byModel,
      matchedModelCount: byModel.length,
      totalSelectedModels: selectedModels.length,
    };
  }, [referencePrices, selectedModels.length]);

  const fitmentComplete = selectedModels.length > 0;
  const detailsComplete = Boolean(
    form.sparePartId && form.title.trim().length >= 3 && form.price,
  );
  const imagesComplete = images.length > 0;

  const steps = [
    { label: "Fitment", done: fitmentComplete },
    { label: "Part details", done: detailsComplete },
    { label: "Images", done: imagesComplete },
  ];
  const completedCount = steps.filter((step) => step.done).length;

  function addModel() {
    const model = models.find((item) => String(item.id) === String(modelId));
    const brand = brands.find((item) => String(item.id) === String(brandId));
    if (!model || !brand) return;

    setSelectedModels((current) => {
      if (current.some((item) => item.id === model.id)) return current;
      return [
        ...current,
        {
          ...model,
          brandName: brand.name,
        },
      ];
    });
    setModelId("");
  }

  function removeModel(id) {
    setSelectedModels((current) => current.filter((item) => item.id !== id));
  }

  function addFiles(fileList) {
    const next = Array.from(fileList ?? []);
    if (!next.length) return;

    const merged = [...images, ...next].slice(0, 6);

    const tooLarge = merged.find((file) => file.size > 8 * 1024 * 1024);
    if (tooLarge) {
      toast.error(`${tooLarge.name} is larger than 8 MB.`);
      return;
    }

    setImages(merged);
  }

  function handleImageChange(event) {
    addFiles(event.target.files);
    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDraggingOver(false);
    addFiles(event.dataTransfer.files);
  }

  function removeImage(index) {
    setImages((current) => current.filter((_, i) => i !== index));
  }

  function adjustQuantity(delta) {
    setForm((current) => {
      const nextValue = Math.max(1, (Number(current.quantity) || 1) + delta);
      return { ...current, quantity: String(nextValue) };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedModels.length) {
      toast.error("Add at least one compatible motorcycle model.");
      return;
    }

    if (!images.length) {
      toast.error("Add at least one product image.");
      return;
    }

    setSubmitting(true);
    let listingId = null;

    try {
      const draftResponse = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          quantity: Number(form.quantity),
          sparePartId: Number(form.sparePartId),
          motorcycleModelIds: selectedModels.map((item) => item.id),
          currency: "TZS",
        }),
      });

      const draftResult = await draftResponse.json();
      if (!draftResponse.ok) {
        throw new Error(draftResult.error || "Could not create listing draft");
      }

      listingId = draftResult.listingId;

      const imageData = new FormData();
      images.forEach((image) => imageData.append("images", image));

      const imageResponse = await fetch(`/api/listings/${listingId}/images`, {
        method: "POST",
        body: imageData,
      });

      const imageResult = await imageResponse.json();
      if (!imageResponse.ok) {
        throw new Error(
          `${imageResult.error || "Image upload failed"}. Draft ${listingId} was preserved.`,
        );
      }

      const publishResponse = await fetch(
        `/api/listings/${listingId}/publish`,
        {
          method: "POST",
        },
      );

      const publishResult = await publishResponse.json();
      if (!publishResponse.ok) {
        throw new Error(
          `${publishResult.error || "Publishing failed"}. Draft ${listingId} was preserved.`,
        );
      }

      toast.success("Product published successfully.");
      router.push(`/products/${listingId}`);
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Product could not be published.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="mx-auto max-w-5xl space-y-6"
      variants={prefersReducedMotion ? undefined : CONTAINER_VARIANTS}
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate={prefersReducedMotion ? undefined : "show"}
    >
      {/* Page header + progress */}
      <motion.div
        variants={prefersReducedMotion ? undefined : SECTION_VARIANTS}
        className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">List a spare part</h1>
            <p className="mt-1 text-sm text-black/60">
              Buyers match parts by fitment first, so start there.
            </p>
          </div>
          <span className="rounded-full bg-black/[0.05] px-3.5 py-1.5 text-sm font-medium text-black/70">
            {completedCount} of {steps.length} sections ready
          </span>
        </div>

        <div className="mt-5 flex items-center gap-2">
          {steps.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2">
                <StepBadge index={i + 1} done={step.done} />
                <span
                  className={`hidden text-sm font-medium sm:block ${
                    step.done ? "text-black" : "text-black/50"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="h-px flex-1 bg-black/10">
                  <motion.div
                    className="h-px bg-black"
                    initial={false}
                    animate={{ width: step.done ? "100%" : "0%" }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Fitment */}
      <motion.section
        variants={prefersReducedMotion ? undefined : SECTION_VARIANTS}
        className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
      >
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-black p-3 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Fitment</h2>
            <p className="mt-1 text-sm text-black/60">
              Select the motorcycle models this exact item is intended to fit.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="space-y-2 text-sm font-medium">
            Brand
            <Select
              value={brandId}
              onChange={(event) => setBrandId(event.target.value)}
            >
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-2 text-sm font-medium">
            Motorcycle model
            <Select
              value={modelId}
              onChange={(event) => setModelId(event.target.value)}
              disabled={!brandId}
            >
              <option value="">Select model</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}{" "}
                  {model.engine_label ? `· ${model.engine_label}` : ""}
                </option>
              ))}
            </Select>
          </label>

          <motion.button
            type="button"
            onClick={addModel}
            disabled={!modelId}
            whileTap={
              !prefersReducedMotion && modelId ? { scale: 0.96 } : undefined
            }
            className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Add
          </motion.button>
        </div>

        <div className="mt-5">
          {selectedModels.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <AnimatePresence initial={false}>
                {selectedModels.map((model) => (
                  <motion.span
                    key={model.id}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.18 }}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] py-2 pl-3 pr-2 text-sm"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    {model.brandName} {model.name}
                    <button
                      type="button"
                      onClick={() => removeModel(model.id)}
                      aria-label={`Remove ${model.brandName} ${model.name}`}
                      className="rounded-full p-0.5 text-black/50 transition-colors hover:bg-black/10 hover:text-black"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-black/15 px-4 py-5 text-sm text-black/50">
              No compatible models added yet. Pick a brand and model above, then
              select Add.
            </div>
          )}
        </div>
      </motion.section>

      {/* Part details */}
      <motion.section
        variants={prefersReducedMotion ? undefined : SECTION_VARIANTS}
        className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
      >
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-black p-3 text-white">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Part details</h2>
            <p className="mt-1 text-sm text-black/60">
              Describe the part, its condition, and how it's priced.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            Part category
            <Select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-2 text-sm font-medium">
            Spare part
            <Select
              required
              value={form.sparePartId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sparePartId: event.target.value,
                }))
              }
              disabled={!categoryId}
            >
              <option value="">Select part</option>
              {parts.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.name}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-2 text-sm font-medium md:col-span-2">
            Listing title
            <input
              required
              minLength={3}
              maxLength={140}
              value={form.title}
              onChange={(event) => {
                setTitleTouched(true);
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }));
              }}
              className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none transition-colors focus:border-black"
            />
            <span className="block text-xs font-normal text-black/40">
              Filled in automatically from the part and model until you edit it.
            </span>
          </label>

          <label className="space-y-2 text-sm font-medium">
            OEM / part number
            <input
              value={form.oemPartNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  oemPartNumber: event.target.value,
                }))
              }
              placeholder="Enter only if known"
              className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none transition-colors placeholder:text-black/30 focus:border-black"
            />
          </label>

          <label className="space-y-2 text-sm font-medium">
            Condition
            <Select
              value={form.condition}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  condition: event.target.value,
                }))
              }
            >
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="refurbished">Refurbished</option>
            </Select>
          </label>

          <label className="space-y-2 text-sm font-medium">
            Price
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-black/40">
                TZS
              </span>
              <input
                required
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={form.price}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    price: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-black/15 py-3 pl-14 pr-4 outline-none transition-colors focus:border-black"
              />
            </div>
          </label>

          <label className="space-y-2 text-sm font-medium">
            Quantity available
            <div className="flex items-center rounded-xl border border-black/15 focus-within:border-black">
              <button
                type="button"
                onClick={() => adjustQuantity(-1)}
                aria-label="Decrease quantity"
                className="flex h-12 w-12 shrink-0 items-center justify-center text-lg text-black/60 transition-colors hover:text-black disabled:opacity-30"
                disabled={Number(form.quantity) <= 1}
              >
                −
              </button>
              <input
                required
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={form.quantity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    quantity: event.target.value,
                  }))
                }
                className="w-full border-x border-black/10 bg-transparent px-2 py-3 text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => adjustQuantity(1)}
                aria-label="Increase quantity"
                className="flex h-12 w-12 shrink-0 items-center justify-center text-lg text-black/60 transition-colors hover:text-black"
              >
                +
              </button>
            </div>
          </label>

          <div className="md:col-span-2">
            <div className="rounded-2xl border border-black/10 bg-black/[0.025] p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-black/45" />
                    <p className="text-sm font-semibold">
                      Catalogue reference price
                    </p>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-black/50">
                    Aurora reference pricing only. Your selling price remains
                    fully under your control.
                  </p>
                </div>

                {referencePriceSummary && !referencePriceLoading ? (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        price: String(
                          Math.round(referencePriceSummary.suggestedPrice),
                        ),
                      }))
                    }
                    className="rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold transition-colors hover:border-black/25"
                  >
                    Use TZS {formatTzs(referencePriceSummary.suggestedPrice)}
                  </button>
                ) : null}
              </div>

              {referencePriceLoading ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-black/50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking catalogue pricing…
                </div>
              ) : referencePriceError ? (
                <p className="mt-4 text-sm text-amber-700">
                  Reference price unavailable: {referencePriceError}
                </p>
              ) : referencePriceSummary ? (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-black/40">
                        Suggested reference
                      </p>
                      <p className="mt-1 text-xl font-semibold">
                        TZS {formatTzs(referencePriceSummary.suggestedPrice)}
                      </p>
                    </div>

                    {referencePriceSummary.minPrice !==
                    referencePriceSummary.maxPrice ? (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-black/40">
                          Selected-model range
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          TZS {formatTzs(referencePriceSummary.minPrice)} –{" "}
                          {formatTzs(referencePriceSummary.maxPrice)}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {referencePriceSummary.byModel.map((item) => (
                      <span
                        key={`${item.brand}-${item.model}`}
                        className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs"
                      >
                        {item.brand} {item.model}:{" "}
                        <strong>TZS {formatTzs(item.price)}</strong>
                      </span>
                    ))}
                  </div>

                  {referencePriceSummary.matchedModelCount <
                  referencePriceSummary.totalSelectedModels ? (
                    <p className="text-xs leading-5 text-black/45">
                      Reference pricing was found for{" "}
                      {referencePriceSummary.matchedModelCount} of{" "}
                      {referencePriceSummary.totalSelectedModels} selected model
                      {referencePriceSummary.totalSelectedModels === 1
                        ? ""
                        : "s"}
                      . Missing models are not guessed.
                    </p>
                  ) : (
                    <p className="text-xs leading-5 text-black/45">
                      Reference pricing matched all selected compatible models.
                    </p>
                  )}
                </div>
              ) : form.sparePartId && selectedModels.length > 0 ? (
                <p className="mt-4 text-sm text-black/45">
                  No safely mapped catalogue reference price is available for
                  this part and model combination yet.
                </p>
              ) : (
                <p className="mt-4 text-sm text-black/45">
                  Add a compatible motorcycle model and choose a spare part to
                  see the catalogue reference price.
                </p>
              )}
            </div>
          </div>

          <label className="space-y-2 text-sm font-medium md:col-span-2">
            Description
            <textarea
              rows={6}
              maxLength={5000}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Wear, compatibility notes, what's included in the box…"
              className="w-full resize-y rounded-xl border border-black/15 px-4 py-3 outline-none transition-colors placeholder:text-black/30 focus:border-black"
            />
            <span className="block text-right text-xs font-normal text-black/40">
              {form.description.length}/5000
            </span>
          </label>

          <label className="flex items-center gap-3 text-sm font-medium md:col-span-2">
            <input
              type="checkbox"
              checked={form.isNegotiable}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isNegotiable: event.target.checked,
                }))
              }
              className="h-4 w-4 accent-black"
            />
            <span className="inline-flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-black/40" />
              Price is negotiable
            </span>
          </label>
        </div>

        {guidance.length > 0 && (
          <div className="mt-6 grid gap-3 border-t border-black/10 pt-6 md:grid-cols-2">
            {guidance.map((item) => (
              <div key={item.key} className="rounded-2xl bg-black/[0.035] p-4">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-black/60">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Images */}
      <motion.section
        variants={prefersReducedMotion ? undefined : SECTION_VARIANTS}
        className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Product images</h2>
            <p className="mt-1 text-sm text-black/60">
              1–6 JPG, PNG or WebP images, maximum 8 MB each.
            </p>
          </div>
          <span className="text-sm font-medium text-black/40">
            {images.length}/6
          </span>
        </div>

        <label
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-8 text-center transition-colors ${
            isDraggingOver
              ? "border-black bg-black/[0.03]"
              : "border-black/20 hover:border-black/40"
          }`}
        >
          <div className="rounded-full bg-black p-2.5 text-white">
            <ImagePlus className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium">
            Drag images here, or click to browse
          </p>
          <p className="text-xs text-black/40">
            The first image becomes the listing's primary photo
          </p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleImageChange}
          />
        </label>

        {imagePreviews.length > 0 && (
          <motion.div
            layout
            className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3"
          >
            <AnimatePresence initial={false}>
              {imagePreviews.map((preview, index) => (
                <motion.div
                  key={preview.url}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.18 }}
                  className="relative overflow-hidden rounded-2xl border border-black/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview.url}
                    alt={preview.file.name}
                    className="aspect-square w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-white p-2 shadow transition-transform hover:scale-105"
                    aria-label={`Remove ${preview.file.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white">
                      Primary
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.section>

      {/* Submit */}
      <motion.div
        variants={prefersReducedMotion ? undefined : SECTION_VARIANTS}
        className="flex items-center justify-between gap-4 rounded-3xl border border-black/10 bg-white/90 p-4 shadow-sm backdrop-blur"
      >
        <p className="hidden text-sm text-black/50 sm:block">
          {completedCount === steps.length
            ? "Everything looks ready to publish."
            : `${steps.length - completedCount} section${steps.length - completedCount === 1 ? "" : "s"} still need attention.`}
        </p>
        <motion.button
          type="submit"
          disabled={submitting}
          whileTap={
            !prefersReducedMotion && !submitting ? { scale: 0.97 } : undefined
          }
          className="ml-auto cursor-pointer inline-flex min-w-48 items-center justify-center gap-2 rounded-xl bg-black px-6 py-2 font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Publishing…
            </>
          ) : (
            "Publish product"
          )}
        </motion.button>
      </motion.div>
    </motion.form>
  );
}
