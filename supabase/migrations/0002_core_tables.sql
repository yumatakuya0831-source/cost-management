begin;

create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  email extensions.citext not null unique,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  display_name text not null check (length(trim(display_name)) > 0),
  role public.user_role not null default 'viewer',
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  dimension public.unit_dimension not null,
  to_base_multiplier numeric(18,6) not null check (to_base_multiplier > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null unique check (length(trim(name)) > 0),
  sale_price_tax_included numeric(14,4) not null check (sale_price_tax_included >= 0),
  yield_quantity numeric(12,4) not null default 20 check (yield_quantity > 0),
  hide_recipe boolean not null default false,
  target_cost_rate numeric(7,6) check (target_cost_rate >= 0 and target_cost_rate < 1),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  base_unit_id uuid not null references public.units(id) on delete restrict,
  loss_rate numeric(7,6) not null default 0 check (loss_rate >= 0 and loss_rate < 1),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  contact_note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table public.purchase_prices (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  price_tax_included numeric(14,4) not null check (price_tax_included >= 0),
  order_lot_count numeric(12,4) not null default 1 check (order_lot_count > 0),
  content_quantity numeric(14,6) not null check (content_quantity > 0),
  content_unit_id uuid not null references public.units(id) on delete restrict,
  effective_from date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  unique (ingredient_id, supplier_id, effective_from)
);

create table public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  usage_quantity numeric(14,6) not null check (usage_quantity > 0),
  usage_unit_id uuid not null references public.units(id) on delete restrict,
  sort_order integer not null default 0,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  unique (product_id, ingredient_id)
);

create index products_category_idx on public.products(category_id);
create index purchase_prices_lookup_idx on public.purchase_prices(ingredient_id, effective_from desc) where is_active;
create index recipe_items_product_idx on public.recipe_items(product_id, sort_order);

commit;
