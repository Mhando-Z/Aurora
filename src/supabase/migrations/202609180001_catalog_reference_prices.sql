-- Aurora reference pricing catalogue
-- Stores all 6,000 pricing rows without overwriting seller listing prices.

create table if not exists public.catalog_reference_prices (
  id uuid primary key default gen_random_uuid(),
  source_sku text not null unique,
  brand text not null,
  source_model text not null,
  source_part text not null,
  wholesale_price numeric(14,2) not null check (wholesale_price >= 0),
  retail_price numeric(14,2) not null check (retail_price >= 0),
  gross_difference numeric(14,2) not null check (gross_difference >= 0),
  currency text not null default 'TZS',
  canonical_model text,
  canonical_spare_part text,
  model_mapping text not null,
  part_mapping text not null,
  catalogue_mapping text not null,
  source_name text not null default 'Aurora 6000 Spare Parts Pricing Master Catalogue',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists catalog_reference_prices_brand_model_idx
  on public.catalog_reference_prices (brand, canonical_model);

create index if not exists catalog_reference_prices_part_idx
  on public.catalog_reference_prices (canonical_spare_part);

create index if not exists catalog_reference_prices_source_lookup_idx
  on public.catalog_reference_prices (brand, source_model, source_part);

create or replace view public.catalog_retail_reference_prices as
select
  source_sku,
  brand,
  source_model,
  source_part,
  retail_price,
  currency,
  canonical_model,
  canonical_spare_part,
  catalogue_mapping
from public.catalog_reference_prices;


create or replace view public.catalog_matched_reference_prices as
select
  brand,
  canonical_model,
  canonical_spare_part,
  min(retail_price) as retail_price,
  min(wholesale_price) as wholesale_price_internal,
  min(gross_difference) as gross_difference_internal,
  min(currency) as currency,
  count(*) as source_row_count
from public.catalog_reference_prices
where catalogue_mapping = 'Matched to existing catalogue'
  and canonical_model is not null
  and canonical_spare_part is not null
group by brand, canonical_model, canonical_spare_part;

alter table public.catalog_reference_prices enable row level security;

revoke all on table public.catalog_reference_prices from anon, authenticated;
grant select on table public.catalog_retail_reference_prices to anon, authenticated;
revoke all on table public.catalog_matched_reference_prices from anon, authenticated;

notify pgrst, 'reload schema';
