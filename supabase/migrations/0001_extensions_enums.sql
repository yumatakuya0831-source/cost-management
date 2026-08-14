begin;

create extension if not exists citext with schema extensions;

do $$ begin
  create type public.user_role as enum ('admin', 'viewer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.unit_dimension as enum ('mass', 'volume', 'count');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.snapshot_status as enum ('draft', 'confirmed');
exception when duplicate_object then null;
end $$;

commit;
