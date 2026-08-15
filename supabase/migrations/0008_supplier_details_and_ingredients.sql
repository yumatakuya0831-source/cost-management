begin;

alter table public.suppliers
  add column contact_person text,
  add column phone text,
  add column email text,
  add column postal_code text,
  add column address text,
  add column order_method text,
  add column payment_terms text,
  add column lead_time_days integer check (lead_time_days is null or lead_time_days >= 0);

create table public.supplier_ingredients (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (supplier_id, ingredient_id)
);

create index supplier_ingredients_supplier_idx on public.supplier_ingredients(supplier_id);
create index supplier_ingredients_ingredient_idx on public.supplier_ingredients(ingredient_id);

insert into public.supplier_ingredients (supplier_id, ingredient_id, created_by)
select distinct supplier_id, ingredient_id, created_by from public.purchase_prices
on conflict (supplier_id, ingredient_id) do nothing;

alter table public.supplier_ingredients enable row level security;
create policy supplier_ingredients_select_allowed on public.supplier_ingredients for select to authenticated using (public.is_allowed_user());
create policy supplier_ingredients_insert_admin on public.supplier_ingredients for insert to authenticated with check (public.is_admin());
create policy supplier_ingredients_delete_admin on public.supplier_ingredients for delete to authenticated using (public.is_admin());
create trigger supplier_ingredients_log after insert or update or delete on public.supplier_ingredients for each row execute function public.write_audit_log();

commit;
