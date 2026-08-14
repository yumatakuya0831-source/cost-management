begin;

alter table public.app_users enable row level security;
alter table public.categories enable row level security;
alter table public.units enable row level security;
alter table public.products enable row level security;
alter table public.ingredients enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchase_prices enable row level security;
alter table public.recipe_items enable row level security;
alter table public.monthly_sales enable row level security;
alter table public.monthly_cost_snapshots enable row level security;
alter table public.monthly_cost_snapshot_items enable row level security;
alter table public.audit_logs enable row level security;

create policy app_users_select_admin_or_self on public.app_users
for select to authenticated
using (public.is_admin() or (auth_user_id = (select auth.uid()) and is_active));
create policy app_users_insert_admin on public.app_users
for insert to authenticated with check (public.is_admin());
create policy app_users_update_admin on public.app_users
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy categories_select_allowed on public.categories
for select to authenticated using (public.is_allowed_user());
create policy categories_insert_admin on public.categories
for insert to authenticated with check (public.is_admin());
create policy categories_update_admin on public.categories
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy units_select_allowed on public.units
for select to authenticated using (public.is_allowed_user());
create policy units_insert_admin on public.units
for insert to authenticated with check (public.is_admin());
create policy units_update_admin on public.units
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy products_select_allowed on public.products
for select to authenticated using (public.is_allowed_user());
create policy products_insert_admin on public.products
for insert to authenticated with check (public.is_admin());
create policy products_update_admin on public.products
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy ingredients_select_allowed on public.ingredients
for select to authenticated using (public.is_allowed_user());
create policy ingredients_insert_admin on public.ingredients
for insert to authenticated with check (public.is_admin());
create policy ingredients_update_admin on public.ingredients
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy suppliers_select_allowed on public.suppliers
for select to authenticated using (public.is_allowed_user());
create policy suppliers_insert_admin on public.suppliers
for insert to authenticated with check (public.is_admin());
create policy suppliers_update_admin on public.suppliers
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy purchase_prices_select_allowed on public.purchase_prices
for select to authenticated using (public.is_allowed_user());
create policy purchase_prices_insert_admin on public.purchase_prices
for insert to authenticated with check (public.is_admin());
create policy purchase_prices_update_admin on public.purchase_prices
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy recipe_items_select_admin on public.recipe_items
for select to authenticated using (public.is_admin());
create policy recipe_items_insert_admin on public.recipe_items
for insert to authenticated with check (public.is_admin());
create policy recipe_items_update_admin on public.recipe_items
for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy recipe_items_delete_admin on public.recipe_items
for delete to authenticated using (public.is_admin());

create policy monthly_sales_select_allowed on public.monthly_sales
for select to authenticated using (public.is_allowed_user());
create policy monthly_sales_insert_admin on public.monthly_sales
for insert to authenticated with check (public.is_admin());
create policy monthly_sales_update_admin on public.monthly_sales
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy snapshots_select_allowed on public.monthly_cost_snapshots
for select to authenticated using (public.is_allowed_user());
create policy snapshot_items_select_admin on public.monthly_cost_snapshot_items
for select to authenticated using (public.is_admin());
create policy audit_logs_select_admin on public.audit_logs
for select to authenticated using (public.is_admin());

revoke all on function public.is_allowed_user() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.claim_app_user() from public;
revoke all on function public.get_visible_recipe(uuid) from public;
revoke all on function public.recalculate_month(date, boolean) from public;
revoke all on function public.get_monthly_dashboard(date) from public;

grant execute on function public.is_allowed_user() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.claim_app_user() to authenticated;
grant execute on function public.get_visible_recipe(uuid) to authenticated;
grant execute on function public.recalculate_month(date, boolean) to authenticated;
grant execute on function public.get_monthly_dashboard(date) to authenticated;

revoke all on public.monthly_cost_snapshot_items from authenticated, anon;
grant select on public.monthly_cost_snapshot_items to authenticated;
revoke all on public.audit_logs from authenticated, anon;
grant select on public.audit_logs to authenticated;

commit;
