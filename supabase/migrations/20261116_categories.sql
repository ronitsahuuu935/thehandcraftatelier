-- Persist catalog categories independently so admins can create them before
-- assigning products. Run in the Supabase SQL editor after the products migration.
create table if not exists public.categories (
  name text primary key check (length(trim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);

insert into public.categories (name)
select distinct trim(category)
from public.products
where nullif(trim(category), '') is not null
on conflict (name) do nothing;

alter table public.categories enable row level security;
grant select on table public.categories to anon, authenticated;
grant insert, update, delete on table public.categories to authenticated;
drop policy if exists "Categories are publicly readable" on public.categories;
create policy "Categories are publicly readable"
  on public.categories for select to anon, authenticated using (true);
drop policy if exists "Authorized admins can manage categories" on public.categories;
create policy "Authorized admins can manage categories"
  on public.categories for all to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));
