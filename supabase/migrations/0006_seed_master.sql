begin;

insert into public.units(code, label, dimension, to_base_multiplier) values
  ('g', 'g', 'mass', 1),
  ('kg', 'kg', 'mass', 1000),
  ('ml', 'ml', 'volume', 1),
  ('l', 'L', 'volume', 1000),
  ('piece', '個', 'count', 1),
  ('bottle', '本', 'count', 1),
  ('cup', '杯', 'count', 1)
on conflict (code) do update set
  label = excluded.label,
  dimension = excluded.dimension,
  to_base_multiplier = excluded.to_base_multiplier;

insert into public.categories(name, sort_order) values
  ('タコス', 10),
  ('カレー', 20),
  ('コーヒー', 30),
  ('アルコール', 40),
  ('ソフトドリンク', 50)
on conflict (name) do update set sort_order = excluded.sort_order;

commit;
