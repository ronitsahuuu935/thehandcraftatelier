-- Connect authenticated checkout users to the existing customers table.

alter table public.customers enable row level security;
grant insert, select, update on public.customers to authenticated;

drop policy if exists "Customers can read their own profile" on public.customers;
create policy "Customers can read their own profile"
  on public.customers for select to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists "Customers can create their own profile" on public.customers;
create policy "Customers can create their own profile"
  on public.customers for insert to authenticated
  with check (auth_user_id = auth.uid());

drop policy if exists "Customers can update their own profile" on public.customers;
create policy "Customers can update their own profile"
  on public.customers for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

drop policy if exists "Admins can read customer profiles" on public.customers;
create policy "Admins can read customer profiles"
  on public.customers for select to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()));
