begin;

create or replace function public.set_audit_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
  end if;
  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.is_allowed_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_users u
    where u.auth_user_id = (select auth.uid()) and u.is_active
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_users u
    where u.auth_user_id = (select auth.uid())
      and u.is_active and u.role = 'admin'::public.user_role
  );
$$;

create or replace function public.claim_app_user()
returns public.app_users
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed public.app_users;
  jwt_email extensions.citext;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  jwt_email := nullif(auth.jwt() ->> 'email', '')::extensions.citext;
  if jwt_email is null or coalesce(
    (auth.jwt() ->> 'email_verified')::boolean,
    (auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean,
    false
  ) is not true then
    raise exception 'A verified Google email is required' using errcode = '28000';
  end if;

  if coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', '') <> 'google' then
    raise exception 'Google authentication is required' using errcode = '28000';
  end if;

  update public.app_users
     set auth_user_id = auth.uid(), last_login_at = now(), updated_at = now(), updated_by = auth.uid()
   where email = jwt_email and is_active
     and (auth_user_id is null or auth_user_id = auth.uid())
  returning * into claimed;

  if claimed.id is null then
    raise exception 'This Google account is not registered' using errcode = '42501';
  end if;
  return claimed;
end;
$$;

create or replace function public.validate_unit_dimension()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  base_dimension public.unit_dimension;
  entered_dimension public.unit_dimension;
begin
  if tg_table_name = 'purchase_prices' then
    select u.dimension into base_dimension
      from public.ingredients i join public.units u on u.id = i.base_unit_id
     where i.id = new.ingredient_id;
    select dimension into entered_dimension from public.units where id = new.content_unit_id;
  else
    select u.dimension into base_dimension
      from public.ingredients i join public.units u on u.id = i.base_unit_id
     where i.id = new.ingredient_id;
    select dimension into entered_dimension from public.units where id = new.usage_unit_id;
  end if;
  if base_dimension is distinct from entered_dimension then
    raise exception 'Ingredient and entered unit dimensions must match' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  record_uuid uuid;
begin
  record_uuid := case when tg_op = 'DELETE' then old.id else new.id end;
  insert into public.audit_logs(actor_user_id, action, table_name, record_id, changed_fields)
  values (auth.uid(), lower(tg_op), tg_table_name, record_uuid, null);
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.get_visible_recipe(requested_product_id uuid)
returns table (
  ingredient_id uuid,
  ingredient_name text,
  usage_quantity numeric,
  unit_code text,
  unit_label text,
  loss_rate numeric,
  sort_order integer,
  note text
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.name, ri.usage_quantity, u.code, u.label, i.loss_rate, ri.sort_order, ri.note
  from public.recipe_items ri
  join public.products p on p.id = ri.product_id
  join public.ingredients i on i.id = ri.ingredient_id
  join public.units u on u.id = ri.usage_unit_id
  where ri.product_id = requested_product_id
    and public.is_allowed_user()
    and (public.is_admin() or not p.hide_recipe)
  order by ri.sort_order, i.name;
$$;

create or replace function public.recalculate_month(requested_month date, overwrite_confirmed boolean default false)
returns table (product_id uuid, snapshot_id uuid, unit_cost numeric, error_message text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  month_start date := date_trunc('month', requested_month)::date;
  month_end date := (date_trunc('month', requested_month) + interval '1 month - 1 day')::date;
  product_row record;
  item_row record;
  price_row record;
  existing_status public.snapshot_status;
  batch_total numeric(14,6);
  computed_unit_cost numeric(14,6);
  sold integer;
  revenue numeric(16,4);
  monthly_total numeric(16,4);
  new_snapshot_id uuid;
  base_usage numeric(18,8);
  base_content numeric(18,8);
  adjusted numeric(18,8);
  computed_item_cost numeric(14,6);
begin
  if not public.is_admin() then
    raise exception 'Administrator permission required' using errcode = '42501';
  end if;

  for product_row in select * from public.products p where p.is_active order by p.name loop
    begin
      select s.status into existing_status
      from public.monthly_cost_snapshots s
      where s.product_id = product_row.id and s.target_month = month_start;

      if existing_status = 'confirmed'::public.snapshot_status and not overwrite_confirmed then
        return query select product_row.id, null::uuid, null::numeric, 'Confirmed snapshot was not overwritten'::text;
        continue;
      end if;

      batch_total := 0;
      for item_row in
        select ri.*, i.name ingredient_name, i.loss_rate,
               usage_unit.to_base_multiplier usage_multiplier
        from public.recipe_items ri
        join public.ingredients i on i.id = ri.ingredient_id and i.is_active
        join public.units usage_unit on usage_unit.id = ri.usage_unit_id
        where ri.product_id = product_row.id
      loop
        select pp.*, content_unit.to_base_multiplier content_multiplier
          into price_row
        from public.purchase_prices pp
        join public.units content_unit on content_unit.id = pp.content_unit_id
        where pp.ingredient_id = item_row.ingredient_id
          and pp.is_active and pp.effective_from <= month_end
        order by pp.effective_from desc, pp.created_at desc
        limit 1;

        if price_row.id is null then
          raise exception 'No purchase price for ingredient %', item_row.ingredient_name;
        end if;

        base_usage := item_row.usage_quantity * item_row.usage_multiplier;
        base_content := price_row.content_quantity * price_row.content_multiplier;
        adjusted := base_usage / (1 - item_row.loss_rate);
        computed_item_cost := (price_row.price_tax_included / base_content) * adjusted;
        batch_total := batch_total + computed_item_cost;
      end loop;

      computed_unit_cost := batch_total / product_row.yield_quantity;
      select coalesce(ms.quantity_sold, 0) into sold
      from (select 1) x left join public.monthly_sales ms
        on ms.product_id = product_row.id and ms.target_month = month_start;
      revenue := product_row.sale_price_tax_included * sold;
      monthly_total := computed_unit_cost * sold;

      insert into public.monthly_cost_snapshots(
        product_id, target_month, status, sale_price, yield_quantity, batch_cost,
        unit_cost, quantity_sold, monthly_revenue, monthly_cost, cost_rate,
        calculated_at, created_by, updated_by
      ) values (
        product_row.id, month_start, 'draft', product_row.sale_price_tax_included,
        product_row.yield_quantity, batch_total, computed_unit_cost, sold, revenue,
        monthly_total, case when revenue = 0 then null else monthly_total / revenue end,
        now(), auth.uid(), auth.uid()
      )
      on conflict (product_id, target_month) do update set
        status = 'draft', sale_price = excluded.sale_price, yield_quantity = excluded.yield_quantity,
        batch_cost = excluded.batch_cost, unit_cost = excluded.unit_cost,
        quantity_sold = excluded.quantity_sold, monthly_revenue = excluded.monthly_revenue,
        monthly_cost = excluded.monthly_cost, cost_rate = excluded.cost_rate,
        calculated_at = excluded.calculated_at, updated_at = now(), updated_by = auth.uid()
      returning id into new_snapshot_id;

      delete from public.monthly_cost_snapshot_items where snapshot_id = new_snapshot_id;

      for item_row in
        select ri.*, i.name ingredient_name, i.loss_rate,
               usage_unit.to_base_multiplier usage_multiplier
        from public.recipe_items ri
        join public.ingredients i on i.id = ri.ingredient_id and i.is_active
        join public.units usage_unit on usage_unit.id = ri.usage_unit_id
        where ri.product_id = product_row.id
      loop
        select pp.*, content_unit.to_base_multiplier content_multiplier
          into price_row
        from public.purchase_prices pp
        join public.units content_unit on content_unit.id = pp.content_unit_id
        where pp.ingredient_id = item_row.ingredient_id
          and pp.is_active and pp.effective_from <= month_end
        order by pp.effective_from desc, pp.created_at desc limit 1;
        base_usage := item_row.usage_quantity * item_row.usage_multiplier;
        base_content := price_row.content_quantity * price_row.content_multiplier;
        adjusted := base_usage / (1 - item_row.loss_rate);
        computed_item_cost := (price_row.price_tax_included / base_content) * adjusted;
        insert into public.monthly_cost_snapshot_items(
          snapshot_id, ingredient_id, purchase_price_id, ingredient_name, unit_price,
          usage_base_quantity, loss_rate, adjusted_quantity, ingredient_cost
        ) values (
          new_snapshot_id, item_row.ingredient_id, price_row.id, item_row.ingredient_name,
          price_row.price_tax_included / base_content, base_usage, item_row.loss_rate,
          adjusted, computed_item_cost
        );
      end loop;
      return query select product_row.id, new_snapshot_id, computed_unit_cost, null::text;
    exception when others then
      return query select product_row.id, null::uuid, null::numeric, sqlerrm::text;
    end;
  end loop;
end;
$$;

create or replace function public.get_monthly_dashboard(requested_month date)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when not public.is_allowed_user() then null else jsonb_build_object(
    'targetMonth', date_trunc('month', requested_month)::date,
    'totalRevenue', coalesce(sum(s.monthly_revenue), 0),
    'totalCost', coalesce(sum(s.monthly_cost), 0),
    'costRate', case when coalesce(sum(s.monthly_revenue), 0) = 0 then null
                     else sum(s.monthly_cost) / sum(s.monthly_revenue) end,
    'quantitySold', coalesce(sum(s.quantity_sold), 0),
    'products', coalesce(jsonb_agg(jsonb_build_object(
      'productId', p.id, 'name', p.name, 'categoryId', p.category_id,
      'salePrice', s.sale_price, 'unitCost', s.unit_cost,
      'monthlyRevenue', s.monthly_revenue, 'monthlyCost', s.monthly_cost,
      'costRate', s.cost_rate, 'quantitySold', s.quantity_sold
    ) order by p.name) filter (where p.id is not null), '[]'::jsonb)
  ) end
  from public.monthly_cost_snapshots s
  join public.products p on p.id = s.product_id
  where s.target_month = date_trunc('month', requested_month)::date;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array['app_users','categories','products','ingredients','suppliers','purchase_prices','recipe_items','monthly_sales','monthly_cost_snapshots']
  loop
    execute format('create trigger %I_set_audit before insert or update on public.%I for each row execute function public.set_audit_columns()', table_name, table_name);
    execute format('create trigger %I_log after insert or update or delete on public.%I for each row execute function public.write_audit_log()', table_name, table_name);
  end loop;
end $$;

create trigger units_set_updated_at before update on public.units
for each row execute function public.set_updated_at();
create trigger purchase_prices_validate_unit before insert or update on public.purchase_prices
for each row execute function public.validate_unit_dimension();
create trigger recipe_items_validate_unit before insert or update on public.recipe_items
for each row execute function public.validate_unit_dimension();

commit;
