import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const expectations = {
  brands: 4,
  motorcycle_models: 58,
  part_categories: 11,
  spare_parts: 117,
  model_part_catalog: 6786,
};

let failed = false;
for (const [table, expected] of Object.entries(expectations)) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { head: true, count: "exact" });

  if (error) {
    console.error(`✗ ${table}: ${error.message}`);
    failed = true;
    continue;
  }

  const ok = (count ?? 0) >= expected;
  console.log(`${ok ? "✓" : "✗"} ${table}: ${count} (expected >= ${expected})`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
console.log("Marketplace catalog verification passed.");
