begin;

create table public.monthly_sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  target_month date not null check (target_month = date_trunc('month', target_month)::date),
  quantity_sold integer not null default 0 check (quantity_sold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  unique (product_id, target_month)
);

create table public.monthly_cost_snapshots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  target_month date not null check (target_month = date_trunc('month', target_month)::date),
  status public.snapshot_status not null default 'draft',
  sale_price numeric(14,4) not null check (sale_price >= 0),
  yield_quantity numeric(12,4) not null check (yield_quantity > 0),
  batch_cost numeric(14,6) not null check (batch_cost >= 0),
  unit_cost numeric(14,6) not null check (unit_cost >= 0),
  quantity_sold integer not null check (quantity_sold >= 0),
  monthly_revenue numeric(16,4) not null check (monthly_revenue >= 0),
  monthly_cost numeric(16,4) not null check (monthly_cost >= 0),
  cost_rate numeric(9,6) check (cost_rate >= 0),
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  unique (product_id, target_month)
);

create table public.monthly_cost_snapshot_items (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.monthly_cost_snapshots(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  purchase_price_id uuid not null references public.purchase_prices(id) on delete restrict,
  ingredient_name text not null,
  unit_price numeric(18,8) not null check (unit_price >= 0),
  usage_base_quantity numeric(18,8) not null check (usage_base_quantity > 0),
  loss_rate numeric(7,6) not null check (loss_rate >= 0 and loss_rate < 1),
  adjusted_quantity numeric(18,8) not null check (adjusted_quantity > 0),
  ingredient_cost numeric(14,6) not null check (ingredient_cost >= 0),
  created_at timestamptz not null default now(),
  unique (snapshot_id, ingredient_id)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  changed_fields jsonb,
  created_at timestamptz not null default now()
);

create index monthly_sales_month_idx on public.monthly_sales(target_month);
create index snapshots_month_idx on public.monthly_cost_snapshots(target_month);
create index snapshot_items_snapshot_idx on public.monthly_cost_snapshot_items(snapshot_id);
create index audit_logs_created_idx on public.audit_logs(created_at desc);

commit;
