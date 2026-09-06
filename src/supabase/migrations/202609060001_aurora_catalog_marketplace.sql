-- Aurora reference catalog + marketplace listings
-- Safe ownership split:
--   Supabase = catalog, commerce metadata, seller ownership, stock and fitment
--   Sanity   = image binary storage/CDN (Supabase stores only the asset id + CDN URL)

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- REFERENCE CATALOG
-- ============================================================

create table if not exists public.brands (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_name_unique unique (name),
  constraint brands_slug_unique unique (slug)
);

create table if not exists public.motorcycle_models (
  id bigint generated always as identity primary key,
  brand_id bigint not null references public.brands(id) on delete restrict,
  name text not null,
  slug text not null,
  engine_cc numeric(7,2),
  engine_label text,
  motorcycle_type text,
  source_reference text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint motorcycle_models_brand_name_unique unique (brand_id, name),
  constraint motorcycle_models_brand_slug_unique unique (brand_id, slug)
);

create table if not exists public.part_categories (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint part_categories_name_unique unique (name),
  constraint part_categories_slug_unique unique (slug)
);

create table if not exists public.spare_parts (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.part_categories(id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  typical_replacement_reason text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint spare_parts_category_name_unique unique (category_id, name),
  constraint spare_parts_category_slug_unique unique (category_id, slug)
);

create table if not exists public.model_part_catalog (
  id bigint generated always as identity primary key,
  motorcycle_model_id bigint not null references public.motorcycle_models(id) on delete cascade,
  spare_part_id bigint not null references public.spare_parts(id) on delete cascade,
  oem_part_number text,
  fitment_status text not null default 'unverified',
  source text not null default 'excel_master_catalog',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint model_part_catalog_model_part_unique unique (motorcycle_model_id, spare_part_id),
  constraint model_part_catalog_fitment_status_check check (
    fitment_status in (
      'unverified',
      'seller_claimed',
      'admin_verified',
      'manufacturer_verified',
      'rejected'
    )
  )
);

-- Repeated workbook instructions are stored once instead of 6,786 times.
create table if not exists public.catalog_guidance (
  key text primary key,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- MARKETPLACE
-- ============================================================

create table if not exists public.product_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  spare_part_id bigint not null references public.spare_parts(id) on delete restrict,
  title text not null,
  description text,
  oem_part_number text,
  condition text not null,
  price numeric(14,2) not null,
  currency text not null default 'TZS',
  quantity integer not null default 1,
  is_negotiable boolean not null default false,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_listings_title_check check (char_length(trim(title)) between 3 and 140),
  constraint product_listings_condition_check check (condition in ('new', 'used', 'refurbished')),
  constraint product_listings_price_check check (price > 0),
  constraint product_listings_currency_check check (char_length(currency) = 3),
  constraint product_listings_quantity_check check (quantity >= 0),
  constraint product_listings_status_check check (
    status in ('draft', 'published', 'sold', 'out_of_stock', 'archived')
  )
);

create table if not exists public.product_listing_fitments (
  product_listing_id uuid not null references public.product_listings(id) on delete cascade,
  motorcycle_model_id bigint not null references public.motorcycle_models(id) on delete restrict,
  fitment_status text not null default 'seller_claimed',
  fitment_note text,
  created_at timestamptz not null default now(),
  primary key (product_listing_id, motorcycle_model_id),
  constraint product_listing_fitments_status_check check (
    fitment_status in ('seller_claimed', 'admin_verified', 'manufacturer_verified', 'rejected')
  )
);

create table if not exists public.product_listing_images (
  id uuid primary key default gen_random_uuid(),
  product_listing_id uuid not null references public.product_listings(id) on delete cascade,
  sanity_asset_id text not null,
  image_url text not null,
  original_filename text,
  width integer,
  height integer,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint product_listing_images_asset_unique unique (product_listing_id, sanity_asset_id),
  constraint product_listing_images_sort_order_check check (sort_order >= 0),
  constraint product_listing_images_width_check check (width is null or width > 0),
  constraint product_listing_images_height_check check (height is null or height > 0)
);

create unique index if not exists product_listing_images_one_primary_idx
  on public.product_listing_images(product_listing_id)
  where is_primary = true;

create index if not exists motorcycle_models_brand_idx
  on public.motorcycle_models(brand_id, active, name);

create index if not exists spare_parts_category_idx
  on public.spare_parts(category_id, active, name);

create index if not exists model_part_catalog_model_idx
  on public.model_part_catalog(motorcycle_model_id, fitment_status);

create index if not exists model_part_catalog_part_idx
  on public.model_part_catalog(spare_part_id, fitment_status);

create index if not exists product_listings_public_browse_idx
  on public.product_listings(status, published_at desc)
  where status = 'published';

create index if not exists product_listings_seller_idx
  on public.product_listings(seller_id, status, created_at desc);

create index if not exists product_listing_fitments_model_idx
  on public.product_listing_fitments(motorcycle_model_id, product_listing_id);

create index if not exists product_listing_images_listing_sort_idx
  on public.product_listing_images(product_listing_id, sort_order);

create index if not exists product_listings_search_idx
  on public.product_listings using gin (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(oem_part_number, ''))
  );

-- ============================================================
-- TRIGGERS
-- ============================================================

drop trigger if exists brands_set_updated_at on public.brands;
create trigger brands_set_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

drop trigger if exists motorcycle_models_set_updated_at on public.motorcycle_models;
create trigger motorcycle_models_set_updated_at
before update on public.motorcycle_models
for each row execute function public.set_updated_at();

drop trigger if exists part_categories_set_updated_at on public.part_categories;
create trigger part_categories_set_updated_at
before update on public.part_categories
for each row execute function public.set_updated_at();

drop trigger if exists spare_parts_set_updated_at on public.spare_parts;
create trigger spare_parts_set_updated_at
before update on public.spare_parts
for each row execute function public.set_updated_at();

drop trigger if exists model_part_catalog_set_updated_at on public.model_part_catalog;
create trigger model_part_catalog_set_updated_at
before update on public.model_part_catalog
for each row execute function public.set_updated_at();

drop trigger if exists catalog_guidance_set_updated_at on public.catalog_guidance;
create trigger catalog_guidance_set_updated_at
before update on public.catalog_guidance
for each row execute function public.set_updated_at();

drop trigger if exists product_listings_set_updated_at on public.product_listings;
create trigger product_listings_set_updated_at
before update on public.product_listings
for each row execute function public.set_updated_at();

create or replace function public.sync_listing_stock_status()
returns trigger
language plpgsql
as $$
begin
  if new.quantity = 0 and new.status = 'published' then
    new.status = 'out_of_stock';
  elsif new.quantity > 0 and old.status = 'out_of_stock' then
    new.status = 'published';
    new.published_at = coalesce(new.published_at, now());
  end if;

  return new;
end;
$$;

drop trigger if exists product_listings_sync_stock_status on public.product_listings;
create trigger product_listings_sync_stock_status
before update of quantity on public.product_listings
for each row execute function public.sync_listing_stock_status();

-- ============================================================
-- ATOMIC LISTING FUNCTIONS
-- ============================================================

create or replace function public.create_product_listing_draft(
  p_spare_part_id bigint,
  p_title text,
  p_description text,
  p_oem_part_number text,
  p_condition text,
  p_price numeric,
  p_currency text,
  p_quantity integer,
  p_is_negotiable boolean,
  p_motorcycle_model_ids bigint[]
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_listing_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_motorcycle_model_ids is null or cardinality(p_motorcycle_model_ids) = 0 then
    raise exception 'At least one compatible motorcycle model is required';
  end if;

  insert into public.product_listings (
    seller_id,
    spare_part_id,
    title,
    description,
    oem_part_number,
    condition,
    price,
    currency,
    quantity,
    is_negotiable,
    status
  )
  values (
    v_user_id,
    p_spare_part_id,
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    nullif(trim(coalesce(p_oem_part_number, '')), ''),
    p_condition,
    p_price,
    upper(p_currency),
    p_quantity,
    coalesce(p_is_negotiable, false),
    'draft'
  )
  returning id into v_listing_id;

  insert into public.product_listing_fitments (
    product_listing_id,
    motorcycle_model_id,
    fitment_status
  )
  select
    v_listing_id,
    model_id,
    'seller_claimed'
  from (
    select distinct unnest(p_motorcycle_model_ids) as model_id
  ) x;

  return v_listing_id;
end;
$$;

create or replace function public.publish_product_listing(p_listing_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_listing public.product_listings%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_listing
  from public.product_listings
  where id = p_listing_id
    and seller_id = v_user_id
  for update;

  if not found then
    raise exception 'Listing not found or not owned by current user';
  end if;

  if v_listing.quantity <= 0 then
    raise exception 'Quantity must be greater than zero before publishing';
  end if;

  if not exists (
    select 1
    from public.product_listing_fitments
    where product_listing_id = p_listing_id
  ) then
    raise exception 'At least one compatible motorcycle model is required';
  end if;

  if not exists (
    select 1
    from public.product_listing_images
    where product_listing_id = p_listing_id
  ) then
    raise exception 'At least one product image is required';
  end if;

  update public.product_listings
  set
    status = 'published',
    published_at = coalesce(published_at, now())
  where id = p_listing_id;

  return p_listing_id;
end;
$$;

grant execute on function public.create_product_listing_draft(
  bigint, text, text, text, text, numeric, text, integer, boolean, bigint[]
) to authenticated;

grant execute on function public.publish_product_listing(uuid) to authenticated;

-- ============================================================
-- RLS + GRANTS
-- ============================================================

alter table public.brands enable row level security;
alter table public.motorcycle_models enable row level security;
alter table public.part_categories enable row level security;
alter table public.spare_parts enable row level security;
alter table public.model_part_catalog enable row level security;
alter table public.catalog_guidance enable row level security;
alter table public.product_listings enable row level security;
alter table public.product_listing_fitments enable row level security;
alter table public.product_listing_images enable row level security;

revoke all on table public.brands from anon, authenticated;
revoke all on table public.motorcycle_models from anon, authenticated;
revoke all on table public.part_categories from anon, authenticated;
revoke all on table public.spare_parts from anon, authenticated;
revoke all on table public.model_part_catalog from anon, authenticated;
revoke all on table public.catalog_guidance from anon, authenticated;
revoke all on table public.product_listings from anon, authenticated;
revoke all on table public.product_listing_fitments from anon, authenticated;
revoke all on table public.product_listing_images from anon, authenticated;

-- Catalog: everybody may read; only service-role/server import/admin code writes.
grant select on table public.brands to anon, authenticated;
grant select on table public.motorcycle_models to anon, authenticated;
grant select on table public.part_categories to anon, authenticated;
grant select on table public.spare_parts to anon, authenticated;
grant select on table public.model_part_catalog to anon, authenticated;
grant select on table public.catalog_guidance to anon, authenticated;

create policy brands_public_read
on public.brands for select
to anon, authenticated
using (active = true);

create policy motorcycle_models_public_read
on public.motorcycle_models for select
to anon, authenticated
using (active = true);

create policy part_categories_public_read
on public.part_categories for select
to anon, authenticated
using (active = true);

create policy spare_parts_public_read
on public.spare_parts for select
to anon, authenticated
using (active = true);

create policy model_part_catalog_public_read
on public.model_part_catalog for select
to anon, authenticated
using (true);

create policy catalog_guidance_public_read
on public.catalog_guidance for select
to anon, authenticated
using (true);

-- Listings: public sees published inventory; seller also sees own drafts/history.
grant select on table public.product_listings to anon, authenticated;
grant insert, update, delete on table public.product_listings to authenticated;

create policy product_listings_read
on public.product_listings for select
to anon, authenticated
using (
  status = 'published'
  or (auth.uid() is not null and seller_id = auth.uid())
);

create policy product_listings_insert_own
on public.product_listings for insert
to authenticated
with check (auth.uid() is not null and seller_id = auth.uid());

create policy product_listings_update_own
on public.product_listings for update
to authenticated
using (auth.uid() is not null and seller_id = auth.uid())
with check (auth.uid() is not null and seller_id = auth.uid());

create policy product_listings_delete_own
on public.product_listings for delete
to authenticated
using (auth.uid() is not null and seller_id = auth.uid());

-- Fitments inherit visibility/ownership from parent listing.
grant select on table public.product_listing_fitments to anon, authenticated;
grant insert, update, delete on table public.product_listing_fitments to authenticated;

create policy product_listing_fitments_read
on public.product_listing_fitments for select
to anon, authenticated
using (
  exists (
    select 1 from public.product_listings l
    where l.id = product_listing_id
      and (
        l.status = 'published'
        or (auth.uid() is not null and l.seller_id = auth.uid())
      )
  )
);

create policy product_listing_fitments_insert_own
on public.product_listing_fitments for insert
to authenticated
with check (
  exists (
    select 1 from public.product_listings l
    where l.id = product_listing_id
      and auth.uid() is not null
      and l.seller_id = auth.uid()
  )
);

create policy product_listing_fitments_update_own
on public.product_listing_fitments for update
to authenticated
using (
  exists (
    select 1 from public.product_listings l
    where l.id = product_listing_id
      and auth.uid() is not null
      and l.seller_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.product_listings l
    where l.id = product_listing_id
      and auth.uid() is not null
      and l.seller_id = auth.uid()
  )
);

create policy product_listing_fitments_delete_own
on public.product_listing_fitments for delete
to authenticated
using (
  exists (
    select 1 from public.product_listings l
    where l.id = product_listing_id
      and auth.uid() is not null
      and l.seller_id = auth.uid()
  )
);

-- Images inherit visibility/ownership from parent listing.
grant select on table public.product_listing_images to anon, authenticated;
grant insert, update, delete on table public.product_listing_images to authenticated;

create policy product_listing_images_read
on public.product_listing_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.product_listings l
    where l.id = product_listing_id
      and (
        l.status = 'published'
        or (auth.uid() is not null and l.seller_id = auth.uid())
      )
  )
);

create policy product_listing_images_insert_own
on public.product_listing_images for insert
to authenticated
with check (
  exists (
    select 1 from public.product_listings l
    where l.id = product_listing_id
      and auth.uid() is not null
      and l.seller_id = auth.uid()
  )
);

create policy product_listing_images_update_own
on public.product_listing_images for update
to authenticated
using (
  exists (
    select 1 from public.product_listings l
    where l.id = product_listing_id
      and auth.uid() is not null
      and l.seller_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.product_listings l
    where l.id = product_listing_id
      and auth.uid() is not null
      and l.seller_id = auth.uid()
  )
);

create policy product_listing_images_delete_own
on public.product_listing_images for delete
to authenticated
using (
  exists (
    select 1 from public.product_listings l
    where l.id = product_listing_id
      and auth.uid() is not null
      and l.seller_id = auth.uid()
  )
);
