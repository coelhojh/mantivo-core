begin;

create or replace function public.slugify(p text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p,'')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.tenants_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.created_by := auth.uid();

  if new.slug is null or length(trim(new.slug)) = 0 then
    new.slug := public.slugify(new.name);
  else
    new.slug := public.slugify(new.slug);
  end if;

  if new.slug is null or length(new.slug) = 0 then
    new.slug := 'tenant-' || replace(gen_random_uuid()::text, '-', '');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_tenants_before_insert on public.tenants;
create trigger trg_tenants_before_insert
before insert on public.tenants
for each row execute function public.tenants_before_insert();

commit;
