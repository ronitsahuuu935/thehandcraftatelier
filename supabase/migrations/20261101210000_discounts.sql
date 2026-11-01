create table if not exists public.discounts (
  code text primary key,
  name text not null,
  type text not null check (type in ('Percentage', 'Fixed Amount')),
  value numeric(12,2) not null check (value > 0),
  applicable_to text not null default 'All Products',
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.discounts enable row level security;

drop policy if exists "Active discounts are publicly readable" on public.discounts;
drop policy if exists "Authorized admins can manage discounts" on public.discounts;
drop policy if exists "Authorized admins can insert discounts" on public.discounts;
drop policy if exists "Authorized admins can update discounts" on public.discounts;
drop policy if exists "Authorized admins can delete discounts" on public.discounts;
create policy "Active discounts are publicly readable"
  on public.discounts for select to anon, authenticated
  using ((valid_from is null or valid_from <= current_date) and (valid_until is null or valid_until >= current_date));

create policy "Authorized admins can insert discounts"
  on public.discounts for insert to authenticated
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

create policy "Authorized admins can update discounts"
  on public.discounts for update to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

create policy "Authorized admins can delete discounts"
  on public.discounts for delete to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()));
