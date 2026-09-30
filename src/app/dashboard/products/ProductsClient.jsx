"use client";

import { useMemo, useState, useTransition } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

import {
  AlertTriangle,
  ArrowDownUp,
  Boxes,
  Check,
  ChevronDown,
  CircleDollarSign,
  Edit3,
  Grid2X2,
  ImageIcon,
  LayoutList,
  MoreHorizontal,
  Package,
  PackageCheck,
  PackagePlus,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "./actions";
import CreateListingForm from "@/components/dashboard/CreateListingForm";

const CONDITIONS = [
  "New",
  "Used - Like New",
  "Used - Good",
  "Used - Fair",
  "Refurbished",
];

function formatMoney(value, currency = "TZS") {
  const amount = Number(value || 0);

  try {
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: currency || "TZS",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency || "TZS"} ${amount.toLocaleString()}`;
  }
}

function getPrimaryImage(product) {
  if (!product?.images?.length) return null;

  return product.images.find((image) => image.is_primary) || product.images[0];
}

function getStockStatus(quantity) {
  const stock = Number(quantity || 0);

  if (stock <= 0) {
    return {
      label: "Out of stock",
      className: "bg-black text-white",
    };
  }

  if (stock <= 5) {
    return {
      label: "Low stock",
      className: "border border-black bg-white text-black",
    };
  }

  return {
    label: "In stock",
    className: "bg-neutral-100 text-black",
  };
}

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-neutral-200 bg-white p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-black">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>
          )}
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white">
          <Icon size={18} />
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductsClient({ initialProducts = [] }) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const [viewMode, setViewMode] = useState("grid");

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [deleteProduct, setDeleteProduct] = useState(null);

  const [notice, setNotice] = useState(null);

  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const totalProducts = initialProducts.length;

    const totalUnits = initialProducts.reduce(
      (total, product) => total + Number(product.quantity || 0),
      0,
    );

    const inventoryValue = initialProducts.reduce(
      (total, product) =>
        total + Number(product.price || 0) * Number(product.quantity || 0),
      0,
    );

    const outOfStock = initialProducts.filter(
      (product) => Number(product.quantity || 0) === 0,
    ).length;

    const lowStock = initialProducts.filter((product) => {
      const quantity = Number(product.quantity || 0);

      return quantity > 0 && quantity <= 5;
    }).length;

    const averagePrice =
      totalProducts > 0
        ? initialProducts.reduce(
            (total, product) => total + Number(product.price || 0),
            0,
          ) / totalProducts
        : 0;

    return {
      totalProducts,
      totalUnits,
      inventoryValue,
      outOfStock,
      lowStock,
      averagePrice,
    };
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    let data = [...initialProducts];

    const term = search.trim().toLowerCase();

    if (term) {
      data = data.filter((product) =>
        product.title?.toLowerCase().includes(term),
      );
    }

    if (condition !== "all") {
      data = data.filter((product) => product.condition === condition);
    }

    if (stockFilter === "available") {
      data = data.filter((product) => Number(product.quantity || 0) > 0);
    }

    if (stockFilter === "low") {
      data = data.filter((product) => {
        const quantity = Number(product.quantity || 0);

        return quantity > 0 && quantity <= 5;
      });
    }

    if (stockFilter === "out") {
      data = data.filter((product) => Number(product.quantity || 0) === 0);
    }

    switch (sort) {
      case "oldest":
        data.sort(
          (a, b) => new Date(a.published_at) - new Date(b.published_at),
        );
        break;

      case "price-high":
        data.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        break;

      case "price-low":
        data.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        break;

      case "stock-high":
        data.sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0));
        break;

      default:
        data.sort(
          (a, b) => new Date(b.published_at) - new Date(a.published_at),
        );
    }

    return data;
  }, [initialProducts, search, condition, stockFilter, sort]);

  function openCreateProduct() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEditProduct(product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  function showNotice(type, message) {
    setNotice({
      type,
      message,
    });

    setTimeout(() => {
      setNotice(null);
    }, 3500);
  }

  function handleDelete() {
    if (!deleteProduct) return;

    startTransition(async () => {
      const result = await deleteProductAction(deleteProduct.id);

      if (!result.success) {
        showNotice("error", result.error || "Unable to delete product.");

        return;
      }

      setDeleteProduct(null);

      showNotice("success", "Product deleted successfully.");

      router.refresh();
    });
  }

  return (
    <div className="min-h-full bg-white text-black">
      <div className="mx-auto w-full max-w-[1600px] px-4 ">
        {/* Header */}
        <div className="flex flex-col gap-5 border-b border-neutral-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-neutral-500">
              <Package size={15} />
              Seller inventory
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Products
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
              Manage your listings, inventory and product information from one
              place.
            </p>
          </div>

          <button
            onClick={openCreateProduct}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.98]"
          >
            <Plus size={17} />
            Add product
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Total listings"
            value={stats.totalProducts.toLocaleString()}
            subtitle="Products currently listed"
            icon={PackageCheck}
          />

          <StatCard
            title="Inventory value"
            value={formatMoney(stats.inventoryValue)}
            subtitle="Price × available units"
            icon={CircleDollarSign}
          />

          <StatCard
            title="Available units"
            value={stats.totalUnits.toLocaleString()}
            subtitle="Total units across listings"
            icon={Boxes}
          />

          <StatCard
            title="Average price"
            value={formatMoney(stats.averagePrice)}
            subtitle="Average listing price"
            icon={TrendingUp}
          />

          <StatCard
            title="Stock alerts"
            value={(stats.lowStock + stats.outOfStock).toLocaleString()}
            subtitle={`${stats.lowStock} low · ${stats.outOfStock} out`}
            icon={AlertTriangle}
          />
        </div>

        {/* Toolbar */}
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your products..."
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-black"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <SlidersHorizontal
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                />

                <select
                  value={condition}
                  onChange={(event) => setCondition(event.target.value)}
                  className="h-10 appearance-none rounded-xl border border-neutral-200 bg-white pl-9 pr-9 text-sm outline-none focus:border-black"
                >
                  <option value="all">All conditions</option>

                  {CONDITIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                />
              </div>

              <select
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
                className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-black"
              >
                <option value="all">All stock</option>
                <option value="available">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>

              <div className="relative">
                <ArrowDownUp
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                />

                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="h-10 appearance-none rounded-xl border border-neutral-200 bg-white pl-9 pr-9 text-sm outline-none focus:border-black"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="stock-high">Most stock</option>
                </select>

                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                />
              </div>

              <div className="flex rounded-xl border border-neutral-200 p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                    viewMode === "grid"
                      ? "bg-black text-white"
                      : "hover:bg-neutral-100"
                  }`}
                >
                  <Grid2X2 size={15} />
                </button>

                <button
                  onClick={() => setViewMode("list")}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                    viewMode === "list"
                      ? "bg-black text-white"
                      : "hover:bg-neutral-100"
                  }`}
                >
                  <LayoutList size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-neutral-100 px-1 pt-3 text-xs text-neutral-500">
            Showing{" "}
            <span className="font-medium text-black">
              {filteredProducts.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-black">
              {initialProducts.length}
            </span>{" "}
            products
          </div>
        </div>

        {/* Products */}
        <div className="mt-5">
          {filteredProducts.length === 0 ? (
            <EmptyProducts
              hasProducts={initialProducts.length > 0}
              onCreate={openCreateProduct}
            />
          ) : viewMode === "grid" ? (
            <ProductGrid
              products={filteredProducts}
              onEdit={openEditProduct}
              onDelete={setDeleteProduct}
            />
          ) : (
            <ProductTable
              products={filteredProducts}
              onEdit={openEditProduct}
              onDelete={setDeleteProduct}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {formOpen && (
          <ProductFormModal
            product={editingProduct}
            onClose={() => setFormOpen(false)}
            onSuccess={(message) => {
              setFormOpen(false);
              showNotice("success", message);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteProduct && (
          <DeleteModal
            product={deleteProduct}
            loading={isPending}
            onCancel={() => !isPending && setDeleteProduct(null)}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notice && <Notification notice={notice} />}
      </AnimatePresence>
    </div>
  );
}

function ProductGrid({ products, onEdit, onDelete }) {
  return (
    <motion.div
      layout
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
    >
      <AnimatePresence>
        {products.map((product) => {
          const image = getPrimaryImage(product);
          const stock = getStockStatus(product.quantity);

          return (
            <motion.article
              layout
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-neutral-300 hover:shadow-sm"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                {image?.image_url ? (
                  <img
                    src={image.image_url}
                    alt={image.alt_text || product.title || "Product"}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-300">
                    <ImageIcon size={34} />
                  </div>
                )}

                <div className="absolute left-3 top-3">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${stock.className}`}
                  >
                    {stock.label}
                  </span>
                </div>

                <div className="absolute right-3 top-3 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    onClick={() => onEdit(product)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black shadow-sm transition hover:bg-black hover:text-white"
                    title="Edit product"
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    onClick={() => onDelete(product)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black shadow-sm transition hover:bg-black hover:text-white"
                    title="Delete product"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-wide text-neutral-400">
                    {product.condition || "Product"}
                  </span>

                  <span className="text-xs text-neutral-500">
                    {product.quantity || 0} units
                  </span>
                </div>

                <h3 className="line-clamp-2 min-h-[44px] text-[15px] font-medium leading-5">
                  {product.title}
                </h3>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-neutral-400">Price</p>

                    <p className="mt-0.5 text-base font-semibold">
                      {formatMoney(product.price, product.currency)}
                    </p>
                  </div>

                  <p className="text-[11px] text-neutral-400">
                    {product.published_at
                      ? new Intl.DateTimeFormat("en", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(product.published_at))
                      : "—"}
                  </p>
                </div>
              </div>
            </motion.article>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

function ProductTable({ products, onEdit, onDelete }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr className="text-xs text-neutral-500">
              <th className="px-5 py-4 font-medium">Product</th>
              <th className="px-5 py-4 font-medium">Price</th>
              <th className="px-5 py-4 font-medium">Stock</th>
              <th className="px-5 py-4 font-medium">Condition</th>
              <th className="px-5 py-4 font-medium">Published</th>
              <th className="px-5 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {products.map((product) => {
              const image = getPrimaryImage(product);
              const stock = getStockStatus(product.quantity);

              return (
                <tr key={product.id} className="transition hover:bg-neutral-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        {image?.image_url ? (
                          <img
                            src={image.image_url}
                            alt={image.alt_text || product.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-neutral-300">
                            <ImageIcon size={18} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="max-w-[280px] truncate text-sm font-medium">
                          {product.title}
                        </p>

                        <p className="mt-1 text-xs text-neutral-400">
                          ID: {String(product.id).slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm font-medium">
                    {formatMoney(product.price, product.currency)}
                  </td>

                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm">{product.quantity || 0}</p>

                      <span
                        className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] ${stock.className}`}
                      >
                        {stock.label}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-neutral-600">
                    {product.condition || "—"}
                  </td>

                  <td className="px-5 py-4 text-sm text-neutral-500">
                    {product.published_at
                      ? new Intl.DateTimeFormat("en", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(product.published_at))
                      : "—"}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onEdit(product)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-neutral-100"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        onClick={() => onDelete(product)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-neutral-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductFormModal({ product, onClose, onSuccess }) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: product?.title || "",
    price: product?.price ?? "",
    quantity: product?.quantity ?? 1,
    currency: product?.currency || "TZS",
    condition: product?.condition || "New",
  });

  const isEditing = Boolean(product);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    setError("");

    startTransition(async () => {
      const values = {
        ...form,
        price: Number(form.price),
        quantity: Number(form.quantity),
      };

      const result = isEditing
        ? await updateProductAction(product.id, values)
        : await createProductAction(values);

      if (!result.success) {
        setError(result.error || "Unable to save product.");

        return;
      }

      router.refresh();

      onSuccess(
        isEditing
          ? "Product updated successfully."
          : "Product created successfully.",
      );
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 40,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 20,
          scale: 0.98,
        }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 30,
        }}
        className={`w-full ${isEditing ? "max-w-xl" : "max-w-5xl"}  rounded-t-3xl bg-white sm:rounded-3xl`}
      >
        {isEditing ? (
          <>
            <form onSubmit={handleSubmit}>
              <div className="flex items-start justify-between border-b border-neutral-200 px-5 py-5 sm:px-6">
                <div>
                  <h2 className="text-lg font-semibold">
                    {isEditing ? "Edit product" : "Create product"}
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    {isEditing
                      ? "Update your product information."
                      : "Add another item to your store."}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-neutral-100 disabled:opacity-40"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-6 sm:px-6">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Product title
                  </label>

                  <input
                    required
                    value={form.title}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                    placeholder="e.g. MacBook Pro 14-inch"
                    className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Price
                    </label>

                    <input
                      required
                      min="0"
                      type="number"
                      value={form.price}
                      onChange={(event) =>
                        updateField("price", event.target.value)
                      }
                      placeholder="0"
                      className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Currency
                    </label>

                    <select
                      value={form.currency}
                      onChange={(event) =>
                        updateField("currency", event.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none focus:border-black"
                    >
                      <option value="TZS">TZS</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Quantity
                    </label>

                    <input
                      required
                      min="0"
                      step="1"
                      type="number"
                      value={form.quantity}
                      onChange={(event) =>
                        updateField("quantity", event.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Condition
                    </label>

                    <select
                      value={form.condition}
                      onChange={(event) =>
                        updateField("condition", event.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3.5 text-sm outline-none focus:border-black"
                    >
                      {CONDITIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl bg-neutral-100 p-3 text-sm">
                    <AlertTriangle size={17} className="mt-0.5 shrink-0" />

                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-neutral-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={onClose}
                  className="h-11 rounded-xl border border-neutral-200 px-5 text-sm font-medium transition hover:bg-neutral-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  disabled={isPending}
                  type="submit"
                  className="flex h-11 min-w-32 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {isEditing ? <Check size={16} /> : <Plus size={16} />}

                      {isEditing ? "Save changes" : "Create product"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="h-[800px]  overflow-y-auto">
            <CreateListingForm />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function DeleteModal({ product, loading, onCancel, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
    >
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 10,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.95,
        }}
        className="w-full max-w-md rounded-3xl bg-white p-6"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
          <Trash2 size={19} />
        </div>

        <h3 className="mt-5 text-lg font-semibold">Delete product?</h3>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          You're about to permanently delete{" "}
          <span className="font-medium text-black">{product.title}</span>. This
          action cannot be undone.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            disabled={loading}
            onClick={onCancel}
            className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={onDelete}
            className="flex h-10 min-w-24 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Deleting
              </>
            ) : (
              <>
                <Trash2 size={15} />
                Delete
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EmptyProducts({ hasProducts, onCreate }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
        <PackagePlus size={23} />
      </div>

      <h3 className="mt-5 text-base font-semibold">
        {hasProducts ? "No matching products" : "Your inventory is empty"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
        {hasProducts
          ? "Try changing your search term or filters."
          : "Create your first listing and start building your product catalogue."}
      </p>

      {!hasProducts && (
        <button
          onClick={onCreate}
          className="mt-5 flex h-10 items-center gap-2 rounded-xl bg-black px-4 text-sm font-medium text-white hover:bg-neutral-800"
        >
          <Plus size={16} />
          Add your first product
        </button>
      )}
    </div>
  );
}

function Notification({ notice }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -15,
        scale: 0.97,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: -10,
      }}
      className="fixed right-4 top-4 z-[150] flex max-w-sm items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-lg"
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          notice.type === "success"
            ? "bg-black text-white"
            : "bg-neutral-100 text-black"
        }`}
      >
        {notice.type === "success" ? (
          <Check size={16} />
        ) : (
          <AlertTriangle size={16} />
        )}
      </div>

      <p className="text-sm">{notice.message}</p>
    </motion.div>
  );
}
