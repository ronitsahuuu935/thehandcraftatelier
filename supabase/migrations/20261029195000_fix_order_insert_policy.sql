-- Allow signed-in customers to create orders for their own customer profile.

drop policy if exists "Customers can create their own orders" on public.orders;
create policy "Customers can create their own orders"
  on public.orders for insert to authenticated
  with check (
    exists (
      select 1
      from public.customers
      where customers.id = orders.customer_id
        and customers.auth_user_id = auth.uid()
    )
  );
