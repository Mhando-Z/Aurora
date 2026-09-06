import { createClient } from "@supabase/supabase-js";

const NEXT_PUBLIC_SUPABASE_URL = "https://gdagjlvlwmagvonhepsc.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkYWdqbHZsd21hZ3ZvbmhlcHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODUxNjY5OSwiZXhwIjoyMTA0MDkyNjk5fQ.YQemsZvMqDQ441eQ6lZ569N_GOwCG1mYMkV2tIPO7QQ";

const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const tables = [
  "carts",
  "cart_items",
  "orders",
  "seller_orders",
  "order_items",
  "payments",
  "payment_events",
  "inventory_movements",
];

let failed = false;
for (const table of tables) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    failed = true;
    console.error(`✗ ${table}: ${error.message}`);
  } else {
    console.log(`✓ ${table}: ${count ?? 0} rows`);
  }
}
if (failed) process.exit(1);
console.log("\nAurora commerce schema is reachable.");
