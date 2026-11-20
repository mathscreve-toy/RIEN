alter table public.beaches
  rename column required_crew to weekday_required_crew;

alter table public.beaches
  rename column promenade_places to chief_positions;

alter table public.beaches
  drop constraint if exists beaches_required_crew_check,
  drop constraint if exists beaches_promenade_places_check;

alter table public.beaches
  add column weekend_required_crew smallint;

update public.beaches
set weekend_required_crew = weekday_required_crew
where weekend_required_crew is null;

alter table public.beaches
  alter column weekend_required_crew set default 2,
  alter column weekend_required_crew set not null,
  alter column chief_positions set default 1,
  add constraint beaches_weekday_required_crew_check
    check (weekday_required_crew between 1 and 3),
  add constraint beaches_weekend_required_crew_check
    check (weekend_required_crew between 1 and 3),
  add constraint beaches_chief_positions_check
    check (chief_positions = 1);

update public.assignments
set position = 'chief'
where position = 'promenade';

alter table public.assignments
  drop constraint if exists assignments_position_check,
  add constraint assignments_position_check
    check (position in ('chief', 'crew'));

create table public.staffing_periods (
  id uuid primary key default gen_random_uuid(),
  beach_id uuid not null references public.beaches(id) on delete cascade,
  label text,
  start_on date not null,
  end_on date not null,
  required_crew smallint not null default 2
    check (required_crew between 1 and 3),
  chief_positions smallint not null default 1
    check (chief_positions = 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staffing_periods_dates_check check (end_on >= start_on),
  unique (beach_id, start_on, end_on)
);

create index staffing_periods_beach_dates_idx
  on public.staffing_periods (beach_id, start_on, end_on);

create trigger staffing_periods_touch_updated_at
before update on public.staffing_periods
for each row execute function public.touch_updated_at();

alter table public.staffing_periods enable row level security;

create policy staffing_periods_select
on public.staffing_periods
for select
to authenticated
using (true);

create policy staffing_periods_manage
on public.staffing_periods
for all
to authenticated
using (
  (select private.current_app_role()) = 'admin'
  or exists (
    select 1
    from public.beaches b
    join public.sector_memberships m on m.sector_id = b.sector_id
    where b.id = staffing_periods.beach_id
      and m.user_id = (select auth.uid())
      and m.sector_role in ('chief', 'assistant')
  )
)
with check (
  (select private.current_app_role()) = 'admin'
  or exists (
    select 1
    from public.beaches b
    join public.sector_memberships m on m.sector_id = b.sector_id
    where b.id = staffing_periods.beach_id
      and m.user_id = (select auth.uid())
      and m.sector_role in ('chief', 'assistant')
  )
);

revoke all on public.staffing_periods from anon;
grant select, insert, update, delete on public.staffing_periods to authenticated;
