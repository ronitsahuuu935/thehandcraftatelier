-- Align the deployed database with the storefront and admin application contract.

alter table public.orders
  add column if not exists items jsonb not null default '[]'::jsonb,
  add column if not exists subtotal numeric(12,2),
  add column if not exists shipping_cost numeric(12,2) not null default 0,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists recipient_name text,
  add column if not exists recipient_email text,
  add column if not exists recipient_phone text,
  add column if not exists shipping_address_line1 text,
  add column if not exists shipping_city text,
  add column if not exists shipping_postal_code text,
  add column if not exists shipping_country text not null default 'India';

update public.orders
set subtotal = coalesce(subtotal, total)
where subtotal is null;

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_payment_status_idx on public.orders (payment_status);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Catalog products are publicly readable" on public.products;
drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.admin_users where user_id = auth.uid())
  );
