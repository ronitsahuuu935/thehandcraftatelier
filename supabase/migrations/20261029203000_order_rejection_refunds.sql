-- Support admin rejection and full Cashfree refunds for paid orders.
alter table public.orders
  add column if not exists cashfree_order_id text,
  add column if not exists cashfree_payment_id text,
  add column if not exists cashfree_refund_id text,
  add column if not exists refund_status text not null default 'not_required',
  add column if not exists rejection_reason text,
  add column if not exists rejected_at timestamptz;

grant update on public.orders to authenticated;
drop policy if exists "Admins can update customer orders" on public.orders;
create policy "Admins can update customer orders"
  on public.orders for update to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

create index if not exists orders_cashfree_order_id_idx on public.orders (cashfree_order_id);
create index if not exists orders_refund_status_idx on public.orders (refund_status);
