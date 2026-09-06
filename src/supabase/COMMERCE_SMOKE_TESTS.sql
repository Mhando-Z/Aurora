-- Read-only post-migration health checks.
select 'carts' as table_name, count(*) as rows from public.carts
union all select 'cart_items', count(*) from public.cart_items
union all select 'orders', count(*) from public.orders
union all select 'seller_orders', count(*) from public.seller_orders
union all select 'order_items', count(*) from public.order_items
union all select 'payments', count(*) from public.payments
union all select 'inventory_movements', count(*) from public.inventory_movements;

-- Order totals must match immutable item snapshots.
select o.id, o.order_number, o.subtotal,
       coalesce(sum(oi.line_total), 0) as calculated_subtotal
from public.orders o
left join public.order_items oi on oi.order_id = o.id
group by o.id
having o.subtotal <> coalesce(sum(oi.line_total), 0);

-- Published stock must be positive after the existing listing stock trigger.
select id, title, status, quantity
from public.product_listings
where status = 'published' and quantity <= 0;

-- A cancellation restore must happen at most once per order item.
select order_item_id, count(*) as restore_count
from public.inventory_movements
where movement_type = 'cancel_restore'
group by order_item_id
having count(*) > 1;
