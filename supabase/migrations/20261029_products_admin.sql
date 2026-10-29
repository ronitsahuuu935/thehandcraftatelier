-- Product catalog administration for The Handcraft Atelier.
-- Apply this in Supabase SQL Editor. Product records below are the existing storefront catalog.

alter table public.products
  add column if not exists image_url text,
  add column if not exists gallery jsonb not null default '[]'::jsonb,
  add column if not exists tag text,
  add column if not exists description text,
  add column if not exists stock_quantity integer;

create unique index if not exists products_id_unique on public.products (id);

insert into public.products (id, name, price, category, image_url, gallery, tag) values
  (1, 'Wildflower Line-Art Shirt', 2499, 'Shirts', '/products/p1.webp', '[{"src":"/products/p1.webp"}]'::jsonb, null),
  (13, 'Monogram Wreath Tee', 1999, 'Personalized', '/products/p13.webp', '[{"src":"/products/p13.webp"},{"src":"/products/p13b.webp"}]'::jsonb, 'Personalized'),
  (7, 'Blue Floral Vine Shirt', 2349, 'Shirts', '/products/p7.webp', '[{"src":"/products/p7.webp"},{"src":"/products/p7b.webp","contain":true}]'::jsonb, null),
  (8, 'Daisy Smocked Top', 2299, 'Tops & Tees', '/products/p8.webp', '[{"src":"/products/p8.webp"},{"src":"/products/p8b.webp","contain":true}]'::jsonb, null),
  (3, 'Panda Pocket Shirt', 1799, 'Shirts', '/products/p3.webp', '[{"src":"/products/p3.webp"}]'::jsonb, null),
  (9, 'Fruit Charm Shirt', 2399, 'Shirts', '/products/p9.webp', '[{"src":"/products/p9.webp"},{"src":"/products/p9b.webp","contain":true}]'::jsonb, null),
  (14, 'Little Princess Floral Dress', 2199, 'Kids', '/products/p14.webp', '[{"src":"/products/p14.webp"}]'::jsonb, null),
  (12, 'Sunflower Sprig Shirt', 2299, 'Shirts', '/products/p12.webp', '[{"src":"/products/p12.webp"}]'::jsonb, null),
  (2, 'Silhouette Bloom Top', 1999, 'Tops & Tees', '/products/p2.webp', '[{"src":"/products/p2.webp"}]'::jsonb, null),
  (4, 'Wild Sprig Pocket Shirt', 2299, 'Shirts', '/products/p4.webp', '[{"src":"/products/p4.webp"},{"src":"/products/p4b.webp"}]'::jsonb, null),
  (5, 'Everyday Sprig Shirt', 2199, 'Shirts', '/products/p5.webp', '[{"src":"/products/p5.webp"}]'::jsonb, null),
  (6, 'Woodland Bunny Cutwork Shirt', 2499, 'Shirts', '/products/p6.webp', '[{"src":"/products/p6.webp"},{"src":"/products/p6b.webp"}]'::jsonb, null),
  (10, 'Palm Tree Shirt', 2499, 'Shirts', '/products/p10.webp', '[{"src":"/products/p10.webp"}]'::jsonb, null)
on conflict (id) do nothing;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
drop policy if exists "Admins can read their own admin grant" on public.admin_users;
create policy "Admins can read their own admin grant"
  on public.admin_users for select to authenticated
  using (user_id = auth.uid());

alter table public.products enable row level security;
drop policy if exists "Catalog products are publicly readable" on public.products;
create policy "Catalog products are publicly readable"
  on public.products for select to anon, authenticated using (true);
drop policy if exists "Authorized admins can manage products" on public.products;
create policy "Authorized admins can manage products"
  on public.products for all to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

-- After applying this file, grant admin access to your Supabase Auth user by running:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
-- on conflict (user_id) do nothing;
