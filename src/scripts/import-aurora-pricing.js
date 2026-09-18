import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseUrl = "https://gdagjlvlwmagvonhepsc.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkYWdqbHZsd21hZ3ZvbmhlcHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODUxNjY5OSwiZXhwIjoyMTA0MDkyNjk5fQ.YQemsZvMqDQ441eQ6lZ569N_GOwCG1mYMkV2tIPO7QQ";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const file = path.join(process.cwd(), "data", "aurora-pricing-catalog.json");
// const file = path.join(__dirname, "..", "data", "aurora-pricing-catalog.json");
const rows = JSON.parse(fs.readFileSync(file, "utf8"));

const payload = rows.map((row) => ({
  source_sku: row.sku,
  brand: row.brand,
  source_model: row.source_model,
  source_part: row.source_part,
  wholesale_price: row.wholesale_price,
  retail_price: row.retail_price,
  gross_difference: row.gross_difference,
  currency: row.currency || "TZS",
  canonical_model: row.canonical_model || null,
  canonical_spare_part: row.canonical_spare_part || null,
  model_mapping: row.model_mapping,
  part_mapping: row.part_mapping,
  catalogue_mapping: row.catalogue_mapping,
}));

const chunkSize = 500;
let imported = 0;

for (let index = 0; index < payload.length; index += chunkSize) {
  const chunk = payload.slice(index, index + chunkSize);

  const { error } = await supabase
    .from("catalog_reference_prices")
    .upsert(chunk, { onConflict: "source_sku" });

  if (error) {
    throw new Error(
      `Import failed at rows ${index + 1}-${index + chunk.length}: ${error.message}`,
    );
  }

  imported += chunk.length;
  console.log(`Imported ${imported}/${payload.length}`);
}

console.log(`Done. ${imported} reference-price rows are in Supabase.`);
