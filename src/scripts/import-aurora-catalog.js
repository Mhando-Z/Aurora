import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    `Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with Node --env-file=.env.local.`,
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const catalogPath = path.join(__dirname, "..", "data", "aurora-catalog.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));

async function upsertInBatches(table, rows, options, batchSize = 500) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(batch, options);
    if (error) {
      throw new Error(`${table} import failed at row ${i}: ${error.message}`);
    }
  }
}

async function exactCount(table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

console.log("Aurora catalog import starting...");

await upsertInBatches("brands", catalog.brands, { onConflict: "slug" });
await upsertInBatches("part_categories", catalog.part_categories, {
  onConflict: "slug",
});

const { data: brandRows, error: brandError } = await supabase
  .from("brands")
  .select("id,name,slug");
if (brandError) throw brandError;

const brandIdByName = new Map(brandRows.map((row) => [row.name, row.id]));

const modelRows = catalog.motorcycle_models.map((model) => ({
  brand_id: brandIdByName.get(model.brand),
  name: model.name,
  slug: model.slug,
  engine_cc: model.engine_cc,
  engine_label: model.engine_label,
  motorcycle_type: model.motorcycle_type,
  source_reference: model.source_reference,
  active: true,
}));

if (modelRows.some((row) => !row.brand_id)) {
  throw new Error(
    "A motorcycle model references a brand that was not imported.",
  );
}

await upsertInBatches("motorcycle_models", modelRows, {
  onConflict: "brand_id,name",
});

const { data: categoryRows, error: categoryError } = await supabase
  .from("part_categories")
  .select("id,name,slug");
if (categoryError) throw categoryError;

const categoryIdByName = new Map(categoryRows.map((row) => [row.name, row.id]));

const sparePartRows = catalog.spare_parts.map((part) => ({
  category_id: categoryIdByName.get(part.category),
  name: part.name,
  slug: part.slug,
  description: part.description,
  typical_replacement_reason: part.typical_replacement_reason,
  active: true,
}));

if (sparePartRows.some((row) => !row.category_id)) {
  throw new Error("A spare part references a category that was not imported.");
}

await upsertInBatches("spare_parts", sparePartRows, {
  onConflict: "category_id,name",
});

await upsertInBatches(
  "catalog_guidance",
  [
    {
      key: "ordering",
      title: "Ordering information",
      body: "Use the exact part number plus motorcycle model/year/frame or engine number where required.",
    },
    {
      key: "fitment-verification",
      title: "Fitment verification",
      body: "Do not assume cross-model compatibility. Compare dimensions, connector, teeth count, mounting points and OEM number before confirming fitment.",
    },
  ],
  { onConflict: "key" },
);

const { data: allModels, error: modelsError } = await supabase
  .from("motorcycle_models")
  .select("id,brand_id,name");
if (modelsError) throw modelsError;

const modelKeySet = new Set(
  modelRows.map((row) => `${row.brand_id}::${row.name}`),
);
const importedModels = allModels.filter((row) =>
  modelKeySet.has(`${row.brand_id}::${row.name}`),
);

const { data: allParts, error: partsError } = await supabase
  .from("spare_parts")
  .select("id,category_id,name");
if (partsError) throw partsError;

const partKeySet = new Set(
  sparePartRows.map((row) => `${row.category_id}::${row.name}`),
);
const importedParts = allParts.filter((row) =>
  partKeySet.has(`${row.category_id}::${row.name}`),
);

if (importedModels.length !== catalog.source.models_count) {
  throw new Error(
    `Expected ${catalog.source.models_count} workbook models after import, found ${importedModels.length}.`,
  );
}

if (importedParts.length !== catalog.source.parts_count) {
  throw new Error(
    `Expected ${catalog.source.parts_count} workbook spare parts after import, found ${importedParts.length}.`,
  );
}

const matrixRows = [];
for (const model of importedModels) {
  for (const part of importedParts) {
    matrixRows.push({
      motorcycle_model_id: model.id,
      spare_part_id: part.id,
      oem_part_number: null,
      fitment_status: "unverified",
      source: "excel_master_catalog",
      notes: null,
    });
  }
}

await upsertInBatches(
  "model_part_catalog",
  matrixRows,
  { onConflict: "motorcycle_model_id,spare_part_id" },
  500,
);

const summary = {
  brands: await exactCount("brands"),
  motorcycle_models: await exactCount("motorcycle_models"),
  part_categories: await exactCount("part_categories"),
  spare_parts: await exactCount("spare_parts"),
  model_part_catalog: await exactCount("model_part_catalog"),
};

console.table(summary);

const expected = {
  brands: 4,
  motorcycle_models: catalog.source.models_count,
  part_categories: 11,
  spare_parts: catalog.source.parts_count,
  model_part_catalog: catalog.source.matrix_count,
};

for (const [key, value] of Object.entries(expected)) {
  if (summary[key] < value) {
    throw new Error(
      `Verification failed for ${key}: expected at least ${value}, found ${summary[key]}`,
    );
  }
}

console.log("Aurora catalog import completed successfully.");
