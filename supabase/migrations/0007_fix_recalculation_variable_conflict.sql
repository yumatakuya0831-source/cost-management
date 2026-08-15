begin;

-- The table-returning function exposes `product_id` as an output variable.
-- Prefer table columns when an SQL statement contains the same identifier
-- (notably ON CONFLICT (product_id, target_month)).
do $migration$
declare
  function_definition text;
  patched_definition text;
begin
  function_definition := pg_get_functiondef(
    'public.recalculate_month(date,boolean)'::regprocedure
  );

  patched_definition := regexp_replace(
    function_definition,
    E'(AS \\$[^$]*\\$\\n)',
    E'\\1#variable_conflict use_column\\n'
  );

  if patched_definition = function_definition then
    raise exception 'Could not patch recalculate_month function definition';
  end if;

  execute patched_definition;
end;
$migration$;

commit;
