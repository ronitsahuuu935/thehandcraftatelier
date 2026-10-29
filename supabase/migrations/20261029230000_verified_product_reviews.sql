-- Let customers read only their own orders, then store reviews linked to a paid purchase.
grant select on public.orders to authenticated;
drop policy if exists "Customers can read their own orders" on public.orders;
create policy "Customers can read their own orders"
  on public.orders for select to authenticated
  using (
    exists (
      select 1
      from public.customers
      where customers.id = orders.customer_id
        and customers.auth_user_id = auth.uid()
    )
  );

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  review text not null check (char_length(review) between 5 and 2000),
  verified_purchase boolean not null default true check (verified_purchase),
  created_at timestamptz not null default now(),
  unique (order_id, product_id)
);

create index if not exists product_reviews_product_created_idx
  on public.product_reviews (product_id, created_at desc);
create index if not exists product_reviews_customer_idx
  on public.product_reviews (customer_id, created_at desc);

alter table public.product_reviews enable row level security;
grant select on public.product_reviews to authenticated;
grant select, insert on public.product_reviews to service_role;
drop policy if exists "Customers can read their own product reviews" on public.product_reviews;
create policy "Customers can read their own product reviews"
  on public.product_reviews for select to authenticated
  using (
    exists (
      select 1
      from public.customers
      where customers.id = product_reviews.customer_id
        and customers.auth_user_id = auth.uid()
    )
  );
