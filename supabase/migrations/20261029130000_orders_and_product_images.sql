-- Persist customer checkout orders and protect their personal details with RLS.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
drop policy if exists "Admins can read their own admin grant" on public.admin_users;
create policy "Admins can read their own admin grant"
  on public.admin_users for select to authenticated
  using (user_id = auth.uid());

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete restrict,
  customer_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  city text not null,
  postal_code text not null,
  items jsonb not null default '[]'::jsonb,
  total numeric(12,2) not null check (total >= 0),
  payment_method text not null default 'Cash on delivery',
  status text not null default 'Pending confirmation',
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_customer_id_idx on public.orders (customer_id);

alter table public.orders enable row level security;
grant insert, select on public.orders to authenticated;
drop policy if exists "Customers can create their own orders" on public.orders;
create policy "Customers can create their own orders"
  on public.orders for insert to authenticated
  with check (customer_id = auth.uid());
drop policy if exists "Admins can read customer orders" on public.orders;
create policy "Admins can read customer orders"
  on public.orders for select to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()));

-- Product images are uploaded to the existing public product-images bucket by admins.
drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.admin_users where user_id = auth.uid())
  );
drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.admin_users where user_id = auth.uid())
  )
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.admin_users where user_id = auth.uid())
  );
