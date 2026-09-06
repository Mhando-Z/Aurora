"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ImagePlus,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { createClient } from "@/lib/supabase/client";

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

export default function CreateListingForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

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
  const [submitting, setSubmitting] = useState(false);

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
  }

  function removeModel(id) {
    setSelectedModels((current) => current.filter((item) => item.id !== id));
  }

  function handleImageChange(event) {
    const next = Array.from(event.target.files ?? []);
    const merged = [...images, ...next].slice(0, 6);

    const tooLarge = merged.find((file) => file.size > 8 * 1024 * 1024);
    if (tooLarge) {
      toast.error(`${tooLarge.name} is larger than 8 MB.`);
      event.target.value = "";
      return;
    }

    setImages(merged);
    event.target.value = "";
  }

  function removeImage(index) {
    setImages((current) => current.filter((_, i) => i !== index));
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-8">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
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
            <select
              value={brandId}
              onChange={(event) => setBrandId(event.target.value)}
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black"
            >
              <option value="">Select brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium">
            Motorcycle model
            <select
              value={modelId}
              onChange={(event) => setModelId(event.target.value)}
              disabled={!brandId}
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 outline-none disabled:opacity-50 focus:border-black"
            >
              <option value="">Select model</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}{" "}
                  {model.engine_label ? `· ${model.engine_label}` : ""}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={addModel}
            disabled={!modelId}
            className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {selectedModels.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {selectedModels.map((model) => (
              <span
                key={model.id}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-2 text-sm"
              >
                <Check className="h-3.5 w-3.5" />
                {model.brandName} {model.name}
                <button type="button" onClick={() => removeModel(model.id)}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Part details</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            Part category
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium">
            Spare part
            <select
              required
              value={form.sparePartId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sparePartId: event.target.value,
                }))
              }
              disabled={!categoryId}
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 outline-none disabled:opacity-50 focus:border-black"
            >
              <option value="">Select part</option>
              {parts.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.name}
                </option>
              ))}
            </select>
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
              className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black"
            />
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
              className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black"
            />
          </label>

          <label className="space-y-2 text-sm font-medium">
            Condition
            <select
              value={form.condition}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  condition: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-black"
            >
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="refurbished">Refurbished</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium">
            Price (TZS)
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.price}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  price: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black"
            />
          </label>

          <label className="space-y-2 text-sm font-medium">
            Quantity
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.quantity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  quantity: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black"
            />
          </label>

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
              className="w-full resize-y rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black"
            />
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
              className="h-4 w-4"
            />
            Price is negotiable
          </label>
        </div>

        {guidance.length > 0 && (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
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
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Product images</h2>
            <p className="mt-1 text-sm text-black/60">
              1–6 JPG, PNG or WebP images, maximum 8 MB each. Images are stored
              in Sanity.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white">
            <ImagePlus className="h-4 w-4" /> Add images
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        </div>

        {images.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            {images.map((image, index) => {
              const preview = URL.createObjectURL(image);
              return (
                <div
                  key={`${image.name}-${index}`}
                  className="relative overflow-hidden rounded-2xl border border-black/10"
                >
                  {/* Native img is used for local blob previews only. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt={image.name}
                    onLoad={() => URL.revokeObjectURL(preview)}
                    className="aspect-square w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-white p-2 shadow"
                    aria-label={`Remove ${image.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white">
                      Primary
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-w-48 items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 font-semibold text-white disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Publishing…
            </>
          ) : (
            "Publish product"
          )}
        </button>
      </div>
    </form>
  );
}
