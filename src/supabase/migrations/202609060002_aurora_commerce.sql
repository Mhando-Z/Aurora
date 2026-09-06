-- Aurora commerce layer
-- Depends on:
--   public.product_listings
--   public.product_listing_images
--   auth.users
--
-- Design:
--   cart -> atomic checkout -> customer order + seller orders + immutable order-item snapshots
--   checkout decrements stock while product rows are locked
--   cancellation restores inventory exactly once
--   COD works immediately
--   online payments use a provider adapter + idempotent webhook path

create extension if not exists pgcrypto;

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active',
  converted_order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_status_check check (status in ('active', 'converted', 'abandoned'))
);

create unique index if not exists carts_one_active_per_user_idx
  on public.carts(user_id)
  where status = 'active';

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_listing_id uuid not null references public.product_listings(id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_quantity_check check (quantity > 0),
  constraint cart_items_cart_listing_unique unique (cart_id, product_listing_id)
);

create index if not exists cart_items_cart_idx
  on public.cart_items(cart_id, created_at);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'awaiting_payment',
  payment_status text not null default 'unpaid',
  payment_method text not null,
  subtotal numeric(14,2) not null,
  shipping_fee numeric(14,2) not null default 0,
  total numeric(14,2) not null,
  currency text not null default 'TZS',
  shipping_address jsonb not null,
  customer_note text,
  placed_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_status_check check (
    status in (
      'awaiting_payment',
      'confirmed',
      'processing',
      'partially_shipped',
      'shipped',
      'partially_delivered',
      'completed',
      'cancelled',
      'payment_failed'
    )
  ),
  constraint orders_payment_status_check check (
    payment_status in (
      'unpaid',
      'pending',
      'paid',
      'failed',
      'cancelled',
      'refunded',
      'partially_refunded'
    )
  ),
  constraint orders_payment_method_check check (
    payment_method in ('cash_on_delivery', 'online')
  ),
  constraint orders_money_check check (
    subtotal >= 0 and shipping_fee >= 0 and total >= 0 and total = subtotal + shipping_fee
  )
);

alter table public.carts
  drop constraint if exists carts_converted_order_id_fkey;

alter table public.carts
  add constraint carts_converted_order_id_fkey
  foreign key (converted_order_id)
  references public.orders(id)
  on delete set null;

create index if not exists orders_customer_idx
  on public.orders(customer_id, placed_at desc);

create index if not exists orders_status_idx
  on public.orders(status, placed_at desc);

create table if not exists public.seller_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending',
  subtotal numeric(14,2) not null,
  shipping_fee numeric(14,2) not null default 0,
  total numeric(14,2) not null,
  currency text not null default 'TZS',
  confirmed_at timestamptz,
  processing_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  seller_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_orders_order_seller_unique unique(order_id, seller_id),
  constraint seller_orders_status_check check (
    status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
  ),
  constraint seller_orders_money_check check (
    subtotal >= 0 and shipping_fee >= 0 and total >= 0 and total = subtotal + shipping_fee
  )
);

create index if not exists seller_orders_seller_idx
  on public.seller_orders(seller_id, created_at desc);

create index if not exists seller_orders_order_idx
  on public.seller_orders(order_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  seller_order_id uuid not null references public.seller_orders(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete restrict,
  product_listing_id uuid references public.product_listings(id) on delete set null,
  product_title text not null,
  product_image_url text,
  oem_part_number text,
  condition text,
  unit_price numeric(14,2) not null,
  quantity integer not null,
  line_total numeric(14,2) not null,
  currency text not null default 'TZS',
  product_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint order_items_quantity_check check (quantity > 0),
  constraint order_items_money_check check (
    unit_price >= 0 and line_total >= 0 and line_total = unit_price * quantity
  )
);

create index if not exists order_items_order_idx
  on public.order_items(order_id);

create index if not exists order_items_seller_order_idx
  on public.order_items(seller_order_id);

create index if not exists order_items_listing_idx
  on public.order_items(product_listing_id)
  where product_listing_id is not null;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete restrict,
  provider text not null,
  method text not null,
  status text not null default 'pending',
  amount numeric(14,2) not null,
  currency text not null default 'TZS',
  provider_payment_id text,
  provider_reference text,
  checkout_url text,
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  failure_message text,
  paid_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_method_check check (method in ('cash_on_delivery', 'online')),
  constraint payments_status_check check (
    status in (
      'pending',
      'requires_action',
      'paid',
      'failed',
      'cancelled',
      'refunded',
      'partially_refunded'
    )
  ),
  constraint payments_amount_check check (amount >= 0)
);

create index if not exists payments_order_idx
  on public.payments(order_id, created_at desc);

create unique index if not exists payments_provider_payment_unique_idx
  on public.payments(provider, provider_payment_id)
  where provider_payment_id is not null;

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  processing_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint payment_events_provider_event_unique unique(provider, provider_event_id)
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_listing_id uuid references public.product_listings(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  order_item_id uuid references public.order_items(id) on delete set null,
  seller_id uuid not null references auth.users(id) on delete restrict,
  movement_type text not null,
  quantity_delta integer not null,
  quantity_after integer not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint inventory_movements_type_check check (
    movement_type in ('checkout_decrement', 'cancel_restore', 'refund_restore', 'manual_adjustment')
  ),
  constraint inventory_movements_delta_check check (quantity_delta <> 0),
  constraint inventory_movements_quantity_after_check check (quantity_after >= 0)
);

create index if not exists inventory_movements_listing_idx
  on public.inventory_movements(product_listing_id, created_at desc);

create index if not exists inventory_movements_seller_idx
  on public.inventory_movements(seller_id, created_at desc);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

drop trigger if exists carts_set_updated_at on public.carts;
create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

drop trigger if exists cart_items_set_updated_at on public.cart_items;
create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists seller_orders_set_updated_at on public.seller_orders;
create trigger seller_orders_set_updated_at
before update on public.seller_orders
for each row execute function public.set_updated_at();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- ============================================================
-- HELPERS
-- ============================================================

-- Uses only PostgreSQL built-ins here so the function does not depend on the pgcrypto extension schema/search_path.
create or replace function public.generate_aurora_order_number()
returns text
language sql
volatile
set search_path = public
as $$
  select
    'AUR-' ||
    to_char(clock_timestamp(), 'YYYYMMDD') ||
    '-' ||
    upper(substr(md5(clock_timestamp()::text || random()::text), 1, 10));
$$;

create or replace function public.get_or_create_active_cart()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cart_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select id
  into v_cart_id
  from public.carts
  where user_id = v_user_id
    and status = 'active'
  order by created_at desc
  limit 1;

  if v_cart_id is null then
    insert into public.carts (user_id, status)
    values (v_user_id, 'active')
    returning id into v_cart_id;
  end if;

  return v_cart_id;
end;
$$;

create or replace function public.add_to_cart(
  p_listing_id uuid,
  p_quantity integer default 1
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cart_id uuid;
  v_item_id uuid;
  v_available integer;
  v_status text;
  v_existing integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select quantity, status
  into v_available, v_status
  from public.product_listings
  where id = p_listing_id;

  if not found or v_status <> 'published' then
    raise exception 'Product is not available';
  end if;

  if exists (
    select 1
    from public.product_listings
    where id = p_listing_id
      and seller_id = v_user_id
  ) then
    raise exception 'You cannot add your own listing to your cart';
  end if;

  v_cart_id := public.get_or_create_active_cart();

  select quantity
  into v_existing
  from public.cart_items
  where cart_id = v_cart_id
    and product_listing_id = p_listing_id;

  if coalesce(v_existing, 0) + p_quantity > v_available then
    raise exception 'Requested quantity exceeds available stock';
  end if;

  insert into public.cart_items (
    cart_id,
    product_listing_id,
    quantity
  )
  values (
    v_cart_id,
    p_listing_id,
    p_quantity
  )
  on conflict (cart_id, product_listing_id)
  do update
    set quantity = public.cart_items.quantity + excluded.quantity
  returning id into v_item_id;

  return v_item_id;
end;
$$;

create or replace function public.set_cart_item_quantity(
  p_cart_item_id uuid,
  p_quantity integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_listing_id uuid;
  v_available integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select ci.product_listing_id
  into v_listing_id
  from public.cart_items ci
  join public.carts c on c.id = ci.cart_id
  where ci.id = p_cart_item_id
    and c.user_id = v_user_id
    and c.status = 'active';

  if not found then
    raise exception 'Cart item not found';
  end if;

  select quantity
  into v_available
  from public.product_listings
  where id = v_listing_id
    and status = 'published';

  if not found then
    raise exception 'Product is no longer available';
  end if;

  if p_quantity > v_available then
    raise exception 'Requested quantity exceeds available stock';
  end if;

  update public.cart_items
  set quantity = p_quantity
  where id = p_cart_item_id;

  return p_cart_item_id;
end;
$$;

create or replace function public.remove_cart_item(p_cart_item_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  delete from public.cart_items ci
  using public.carts c
  where ci.id = p_cart_item_id
    and c.id = ci.cart_id
    and c.user_id = v_user_id
    and c.status = 'active';

  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

-- ============================================================
-- ATOMIC CHECKOUT
-- ============================================================

create or replace function public.checkout_active_cart(
  p_shipping_address jsonb,
  p_customer_note text default null,
  p_payment_method text default 'cash_on_delivery'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cart_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_currency text;
  v_subtotal numeric(14,2);
  v_shipping_fee numeric(14,2) := 0;
  v_order_status text;
  v_payment_status text;
  v_payment_provider text;
  v_payment_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_payment_method not in ('cash_on_delivery', 'online') then
    raise exception 'Unsupported payment method';
  end if;

  if p_shipping_address is null
     or jsonb_typeof(p_shipping_address) <> 'object'
     or coalesce(trim(p_shipping_address->>'full_name'), '') = ''
     or coalesce(trim(p_shipping_address->>'phone'), '') = ''
     or coalesce(trim(p_shipping_address->>'region'), '') = ''
     or coalesce(trim(p_shipping_address->>'district'), '') = ''
     or coalesce(trim(p_shipping_address->>'address_line'), '') = '' then
    raise exception 'A complete shipping address is required';
  end if;

  select id
  into v_cart_id
  from public.carts
  where user_id = v_user_id
    and status = 'active'
  order by created_at desc
  limit 1
  for update;

  if v_cart_id is null then
    raise exception 'Your cart is empty';
  end if;

  if not exists (
    select 1 from public.cart_items where cart_id = v_cart_id
  ) then
    raise exception 'Your cart is empty';
  end if;

  -- Lock product rows in a deterministic order. Concurrent checkouts for the
  -- same listing serialize here, preventing both buyers from consuming the
  -- same final unit.
  perform p.id
  from public.product_listings p
  join public.cart_items ci on ci.product_listing_id = p.id
  where ci.cart_id = v_cart_id
  order by p.id
  for update of p;

  if exists (
    select 1
    from public.cart_items ci
    left join public.product_listings p on p.id = ci.product_listing_id
    where ci.cart_id = v_cart_id
      and (
        p.id is null
        or p.status <> 'published'
        or p.quantity < ci.quantity
        or p.seller_id = v_user_id
      )
  ) then
    raise exception 'One or more cart items are unavailable, out of stock, or invalid';
  end if;

  if (
    select count(distinct p.currency)
    from public.cart_items ci
    join public.product_listings p on p.id = ci.product_listing_id
    where ci.cart_id = v_cart_id
  ) <> 1 then
    raise exception 'A single order cannot contain multiple currencies';
  end if;

  select
    min(p.currency),
    sum(p.price * ci.quantity)
  into
    v_currency,
    v_subtotal
  from public.cart_items ci
  join public.product_listings p on p.id = ci.product_listing_id
  where ci.cart_id = v_cart_id;

  v_order_status := case
    when p_payment_method = 'cash_on_delivery' then 'confirmed'
    else 'awaiting_payment'
  end;

  v_payment_status := case
    when p_payment_method = 'cash_on_delivery' then 'unpaid'
    else 'pending'
  end;

  v_payment_provider := case
    when p_payment_method = 'cash_on_delivery' then 'cash_on_delivery'
    else 'pending_provider'
  end;

  -- Retry a few times in the extremely unlikely event of a random order-number collision.
  loop
    v_order_number := public.generate_aurora_order_number();

    begin
      insert into public.orders (
        order_number,
        customer_id,
        status,
        payment_status,
        payment_method,
        subtotal,
        shipping_fee,
        total,
        currency,
        shipping_address,
        customer_note
      )
      values (
        v_order_number,
        v_user_id,
        v_order_status,
        v_payment_status,
        p_payment_method,
        v_subtotal,
        v_shipping_fee,
        v_subtotal + v_shipping_fee,
        v_currency,
        p_shipping_address,
        nullif(trim(coalesce(p_customer_note, '')), '')
      )
      returning id into v_order_id;

      exit;
    exception when unique_violation then
      -- regenerate and retry
    end;
  end loop;

  insert into public.seller_orders (
    order_id,
    seller_id,
    status,
    subtotal,
    shipping_fee,
    total,
    currency
  )
  select
    v_order_id,
    p.seller_id,
    case
      when p_payment_method = 'cash_on_delivery' then 'confirmed'
      else 'pending'
    end,
    sum(p.price * ci.quantity),
    0,
    sum(p.price * ci.quantity),
    v_currency
  from public.cart_items ci
  join public.product_listings p on p.id = ci.product_listing_id
  where ci.cart_id = v_cart_id
  group by p.seller_id;

  insert into public.order_items (
    order_id,
    seller_order_id,
    seller_id,
    product_listing_id,
    product_title,
    product_image_url,
    oem_part_number,
    condition,
    unit_price,
    quantity,
    line_total,
    currency,
    product_snapshot
  )
  select
    v_order_id,
    so.id,
    p.seller_id,
    p.id,
    p.title,
    img.image_url,
    p.oem_part_number,
    p.condition,
    p.price,
    ci.quantity,
    p.price * ci.quantity,
    p.currency,
    jsonb_build_object(
      'listing_id', p.id,
      'spare_part_id', p.spare_part_id,
      'title', p.title,
      'description', p.description,
      'oem_part_number', p.oem_part_number,
      'condition', p.condition,
      'unit_price', p.price,
      'currency', p.currency,
      'seller_id', p.seller_id,
      'primary_image_url', img.image_url
    )
  from public.cart_items ci
  join public.product_listings p on p.id = ci.product_listing_id
  join public.seller_orders so
    on so.order_id = v_order_id
   and so.seller_id = p.seller_id
  left join lateral (
    select pli.image_url
    from public.product_listing_images pli
    where pli.product_listing_id = p.id
    order by pli.is_primary desc, pli.sort_order asc, pli.created_at asc
    limit 1
  ) img on true
  where ci.cart_id = v_cart_id;

  update public.product_listings p
  set quantity = p.quantity - x.qty
  from (
    select product_listing_id, sum(quantity)::integer as qty
    from public.cart_items
    where cart_id = v_cart_id
    group by product_listing_id
  ) x
  where p.id = x.product_listing_id;

  insert into public.inventory_movements (
    product_listing_id,
    order_id,
    order_item_id,
    seller_id,
    movement_type,
    quantity_delta,
    quantity_after,
    reason
  )
  select
    oi.product_listing_id,
    v_order_id,
    oi.id,
    oi.seller_id,
    'checkout_decrement',
    -oi.quantity,
    p.quantity,
    'Stock committed at checkout'
  from public.order_items oi
  join public.product_listings p on p.id = oi.product_listing_id
  where oi.order_id = v_order_id;

  insert into public.payments (
    order_id,
    customer_id,
    provider,
    method,
    status,
    amount,
    currency,
    idempotency_key
  )
  values (
    v_order_id,
    v_user_id,
    v_payment_provider,
    p_payment_method,
    case
      when p_payment_method = 'cash_on_delivery' then 'pending'
      else 'requires_action'
    end,
    v_subtotal + v_shipping_fee,
    v_currency,
    'checkout:' || v_order_id::text
  )
  returning id into v_payment_id;

  update public.carts
  set
    status = 'converted',
    converted_order_id = v_order_id
  where id = v_cart_id;

  return v_order_id;
end;
$$;

-- ============================================================
-- CANCELLATION + STOCK RESTORE
-- ============================================================

create or replace function public.cancel_customer_order(
  p_order_id uuid,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
  v_item record;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
    and customer_id = v_user_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.status = 'cancelled' then
    return p_order_id;
  end if;

  if v_order.status not in ('awaiting_payment', 'confirmed') then
    raise exception 'This order can no longer be cancelled by the customer';
  end if;

  if v_order.payment_status = 'paid' then
    raise exception 'Paid orders require a refund workflow and cannot be self-cancelled';
  end if;

  -- Once a seller has started processing/shipping, customer self-cancellation is disabled.
  if exists (
    select 1
    from public.seller_orders
    where order_id = p_order_id
      and status in ('processing', 'shipped', 'delivered')
  ) then
    raise exception 'This order is already being fulfilled';
  end if;

  -- Lock listings before restoring.
  perform p.id
  from public.product_listings p
  join public.order_items oi on oi.product_listing_id = p.id
  where oi.order_id = p_order_id
  order by p.id
  for update of p;

  for v_item in
    select oi.*
    from public.order_items oi
    where oi.order_id = p_order_id
      and oi.product_listing_id is not null
  loop
    -- Restore only if this order has not already recorded a restore for the item.
    if not exists (
      select 1
      from public.inventory_movements im
      where im.order_item_id = v_item.id
        and im.movement_type = 'cancel_restore'
    ) then
      update public.product_listings
      set quantity = quantity + v_item.quantity
      where id = v_item.product_listing_id;

      insert into public.inventory_movements (
        product_listing_id,
        order_id,
        order_item_id,
        seller_id,
        movement_type,
        quantity_delta,
        quantity_after,
        reason
      )
      select
        v_item.product_listing_id,
        p_order_id,
        v_item.id,
        v_item.seller_id,
        'cancel_restore',
        v_item.quantity,
        p.quantity,
        coalesce(nullif(trim(coalesce(p_reason, '')), ''), 'Customer cancelled order')
      from public.product_listings p
      where p.id = v_item.product_listing_id;
    end if;
  end loop;

  update public.seller_orders
  set
    status = 'cancelled',
    cancelled_at = now()
  where order_id = p_order_id
    and status <> 'cancelled';

  update public.payments
  set
    status = case
      when status in ('paid', 'refunded', 'partially_refunded') then status
      else 'cancelled'
    end
  where order_id = p_order_id;

  update public.orders
  set
    status = 'cancelled',
    payment_status = case
      when payment_status in ('paid', 'refunded', 'partially_refunded') then payment_status
      else 'cancelled'
    end,
    cancelled_at = now(),
    cancellation_reason = nullif(trim(coalesce(p_reason, '')), '')
  where id = p_order_id;

  return p_order_id;
end;
$$;

-- ============================================================
-- PAYMENT STATE (server/service-role calls this after verified provider event)
-- ============================================================

create or replace function public.apply_verified_payment_result(
  p_payment_id uuid,
  p_provider text,
  p_provider_payment_id text,
  p_provider_reference text,
  p_new_status text,
  p_metadata jsonb default '{}'::jsonb,
  p_failure_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
begin
  if p_new_status not in ('requires_action', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded') then
    raise exception 'Unsupported payment status';
  end if;

  select *
  into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found';
  end if;

  -- Never let a late/duplicated failure or cancellation event regress a
  -- payment that was already confirmed paid/refunded.
  if v_payment.status in ('paid', 'refunded', 'partially_refunded')
     and p_new_status in ('requires_action', 'failed', 'cancelled') then
    return v_payment.order_id;
  end if;

  update public.payments
  set
    provider = coalesce(nullif(trim(p_provider), ''), provider),
    provider_payment_id = coalesce(nullif(trim(p_provider_payment_id), ''), provider_payment_id),
    provider_reference = coalesce(nullif(trim(p_provider_reference), ''), provider_reference),
    status = p_new_status,
    metadata = coalesce(metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb),
    failure_message = case when p_new_status = 'failed' then p_failure_message else null end,
    paid_at = case when p_new_status = 'paid' then coalesce(paid_at, now()) else paid_at end,
    failed_at = case when p_new_status = 'failed' then now() else failed_at end
  where id = p_payment_id;

  if p_new_status = 'paid' then
    update public.orders
    set
      payment_status = 'paid',
      status = case when status = 'awaiting_payment' then 'confirmed' else status end
    where id = v_payment.order_id;

    update public.seller_orders
    set
      status = case when status = 'pending' then 'confirmed' else status end,
      confirmed_at = case when status = 'pending' then now() else confirmed_at end
    where order_id = v_payment.order_id;
  elsif p_new_status = 'failed' then
    update public.orders
    set payment_status = 'failed'
    where id = v_payment.order_id
      and payment_status <> 'paid';
  elsif p_new_status = 'cancelled' then
    update public.orders
    set payment_status = 'cancelled'
    where id = v_payment.order_id
      and payment_status <> 'paid';
  elsif p_new_status = 'refunded' then
    update public.orders
    set payment_status = 'refunded'
    where id = v_payment.order_id;
  elsif p_new_status = 'partially_refunded' then
    update public.orders
    set payment_status = 'partially_refunded'
    where id = v_payment.order_id;
  end if;

  return v_payment.order_id;
end;
$$;

revoke all on function public.apply_verified_payment_result(
  uuid, text, text, text, text, jsonb, text
) from public, anon, authenticated;
grant execute on function public.apply_verified_payment_result(
  uuid, text, text, text, text, jsonb, text
) to service_role;

-- ============================================================
-- SELLER FULFILLMENT
-- ============================================================

create or replace function public.seller_update_order_status(
  p_seller_order_id uuid,
  p_status text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_seller_order public.seller_orders%rowtype;
  v_parent_order public.orders%rowtype;
  v_all_count integer;
  v_delivered_count integer;
  v_shipped_count integer;
  v_cancelled_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_status not in ('confirmed', 'processing', 'shipped', 'delivered') then
    raise exception 'Unsupported seller order status';
  end if;

  select *
  into v_seller_order
  from public.seller_orders
  where id = p_seller_order_id
    and seller_id = v_user_id
  for update;

  if not found then
    raise exception 'Seller order not found';
  end if;

  if v_seller_order.status = 'cancelled' then
    raise exception 'Cancelled seller orders cannot be updated';
  end if;

  select *
  into v_parent_order
  from public.orders
  where id = v_seller_order.order_id
  for update;

  if v_parent_order.status = 'cancelled' then
    raise exception 'The customer order is cancelled';
  end if;

  if v_parent_order.payment_method = 'online'
     and v_parent_order.payment_status <> 'paid'
     and p_status in ('confirmed', 'processing', 'shipped', 'delivered') then
    raise exception 'Online payment must be confirmed before fulfillment';
  end if;

  -- Enforce ordered fulfillment progression; API retries may repeat the same status.
  if (
    case p_status
      when 'confirmed' then 1
      when 'processing' then 2
      when 'shipped' then 3
      when 'delivered' then 4
      else -1
    end
  ) < (
    case v_seller_order.status
      when 'pending' then 0
      when 'confirmed' then 1
      when 'processing' then 2
      when 'shipped' then 3
      when 'delivered' then 4
      else -1
    end
  ) then
    raise exception 'Seller order status cannot move backwards';
  end if;

  if (
    case p_status
      when 'confirmed' then 1
      when 'processing' then 2
      when 'shipped' then 3
      when 'delivered' then 4
      else -1
    end
  ) > (
    case v_seller_order.status
      when 'pending' then 0
      when 'confirmed' then 1
      when 'processing' then 2
      when 'shipped' then 3
      when 'delivered' then 4
      else -1
    end + 1
  ) then
    raise exception 'Seller order status cannot skip fulfillment stages';
  end if;

  update public.seller_orders
  set
    status = p_status,
    seller_note = coalesce(nullif(trim(coalesce(p_note, '')), ''), seller_note),
    confirmed_at = case when p_status = 'confirmed' then coalesce(confirmed_at, now()) else confirmed_at end,
    processing_at = case when p_status = 'processing' then coalesce(processing_at, now()) else processing_at end,
    shipped_at = case when p_status = 'shipped' then coalesce(shipped_at, now()) else shipped_at end,
    delivered_at = case when p_status = 'delivered' then coalesce(delivered_at, now()) else delivered_at end
  where id = p_seller_order_id;

  select
    count(*),
    count(*) filter (where status = 'delivered'),
    count(*) filter (where status = 'shipped'),
    count(*) filter (where status = 'cancelled')
  into
    v_all_count,
    v_delivered_count,
    v_shipped_count,
    v_cancelled_count
  from public.seller_orders
  where order_id = v_seller_order.order_id;

  update public.orders
  set status =
    case
      when v_delivered_count = v_all_count then 'completed'
      when v_delivered_count > 0 then 'partially_delivered'
      when v_shipped_count = (v_all_count - v_cancelled_count) and v_shipped_count > 0 then 'shipped'
      when v_shipped_count > 0 then 'partially_shipped'
      when exists (
        select 1 from public.seller_orders
        where order_id = v_seller_order.order_id
          and status = 'processing'
      ) then 'processing'
      else status
    end
  where id = v_seller_order.order_id;

  -- For COD, delivered seller orders imply payment collection. When every
  -- non-cancelled seller order is delivered, mark the customer payment paid.
  if v_parent_order.payment_method = 'cash_on_delivery'
     and v_delivered_count = (v_all_count - v_cancelled_count)
     and v_delivered_count > 0 then
    update public.payments
    set
      status = 'paid',
      paid_at = coalesce(paid_at, now())
    where order_id = v_seller_order.order_id
      and method = 'cash_on_delivery'
      and status <> 'paid';

    update public.orders
    set payment_status = 'paid'
    where id = v_seller_order.order_id;
  end if;

  return v_seller_order.order_id;
end;
$$;

-- ============================================================
-- RLS VISIBILITY HELPERS
-- Avoid cross-table RLS recursion between orders and seller_orders.
-- ============================================================

create or replace function public.is_customer_for_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and o.customer_id = auth.uid()
  );
$$;

create or replace function public.is_seller_for_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.seller_orders so
    where so.order_id = p_order_id
      and so.seller_id = auth.uid()
  );
$$;

revoke all on function public.is_customer_for_order(uuid) from public, anon;
revoke all on function public.is_seller_for_order(uuid) from public, anon;
grant execute on function public.is_customer_for_order(uuid) to authenticated;
grant execute on function public.is_seller_for_order(uuid) to authenticated;

-- ============================================================
-- GRANTS / RLS
-- ============================================================

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.seller_orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.inventory_movements enable row level security;

revoke all on table public.carts from anon, authenticated;
revoke all on table public.cart_items from anon, authenticated;
revoke all on table public.orders from anon, authenticated;
revoke all on table public.seller_orders from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;
revoke all on table public.payments from anon, authenticated;
revoke all on table public.payment_events from anon, authenticated;
revoke all on table public.inventory_movements from anon, authenticated;

grant select on table public.carts to authenticated;
grant select on table public.cart_items to authenticated;
grant select on table public.orders to authenticated;
grant select on table public.seller_orders to authenticated;
grant select on table public.order_items to authenticated;
grant select on table public.payments to authenticated;
grant select on table public.inventory_movements to authenticated;

drop policy if exists carts_owner_read on public.carts;
create policy carts_owner_read
on public.carts for select
to authenticated
using (public.carts.user_id = auth.uid());

-- The original marketplace RLS normally exposes only published listings to
-- buyers. Keep a listing readable to a buyer while it is in that buyer's
-- active cart so an out-of-stock/archived item remains visible and removable.
drop policy if exists product_listings_active_cart_customer_read on public.product_listings;
create policy product_listings_active_cart_customer_read
on public.product_listings for select
to authenticated
using (
  exists (
    select 1
    from public.cart_items ci
    join public.carts c on c.id = ci.cart_id
    where ci.product_listing_id = public.product_listings.id
      and c.user_id = auth.uid()
      and c.status = 'active'
  )
);

drop policy if exists cart_items_owner_read on public.cart_items;
create policy cart_items_owner_read
on public.cart_items for select
to authenticated
using (
  exists (
    select 1 from public.carts c
    where c.id = public.cart_items.cart_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists orders_customer_read on public.orders;
create policy orders_customer_read
on public.orders for select
to authenticated
using (public.orders.customer_id = auth.uid());

drop policy if exists orders_seller_read on public.orders;
create policy orders_seller_read
on public.orders for select
to authenticated
using (public.is_seller_for_order(public.orders.id));

drop policy if exists seller_orders_customer_read on public.seller_orders;
create policy seller_orders_customer_read
on public.seller_orders for select
to authenticated
using (public.is_customer_for_order(public.seller_orders.order_id));

drop policy if exists seller_orders_seller_read on public.seller_orders;
create policy seller_orders_seller_read
on public.seller_orders for select
to authenticated
using (public.seller_orders.seller_id = auth.uid());

drop policy if exists order_items_customer_read on public.order_items;
create policy order_items_customer_read
on public.order_items for select
to authenticated
using (public.is_customer_for_order(public.order_items.order_id));

drop policy if exists order_items_seller_read on public.order_items;
create policy order_items_seller_read
on public.order_items for select
to authenticated
using (public.order_items.seller_id = auth.uid());

drop policy if exists payments_customer_read on public.payments;
create policy payments_customer_read
on public.payments for select
to authenticated
using (public.payments.customer_id = auth.uid());

drop policy if exists inventory_movements_seller_read on public.inventory_movements;
create policy inventory_movements_seller_read
on public.inventory_movements for select
to authenticated
using (public.inventory_movements.seller_id = auth.uid());

revoke all on function public.get_or_create_active_cart() from public, anon;
revoke all on function public.add_to_cart(uuid, integer) from public, anon;
revoke all on function public.set_cart_item_quantity(uuid, integer) from public, anon;
revoke all on function public.remove_cart_item(uuid) from public, anon;
revoke all on function public.checkout_active_cart(jsonb, text, text) from public, anon;
revoke all on function public.cancel_customer_order(uuid, text) from public, anon;
revoke all on function public.seller_update_order_status(uuid, text, text) from public, anon;

grant execute on function public.get_or_create_active_cart() to authenticated;
grant execute on function public.add_to_cart(uuid, integer) to authenticated;
grant execute on function public.set_cart_item_quantity(uuid, integer) to authenticated;
grant execute on function public.remove_cart_item(uuid) to authenticated;
grant execute on function public.checkout_active_cart(jsonb, text, text) to authenticated;
grant execute on function public.cancel_customer_order(uuid, text) to authenticated;
grant execute on function public.seller_update_order_status(uuid, text, text) to authenticated;


notify pgrst, 'reload schema';
