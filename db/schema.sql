-- Executar no SQL Editor do Supabase. Projetos privados do UMBRAL Studio.
create table if not exists public.studio_projects(
 id text primary key,
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null default 'Sem título',
 format text not null check(format in ('portrait','square','story')),
 data jsonb not null,
 updated_at timestamptz not null default now()
);
create index if not exists studio_projects_owner_idx on public.studio_projects(owner_id,updated_at desc);
alter table public.studio_projects enable row level security;
-- Privilégios do Data API: acesso somente para usuários autenticados, com RLS ativo.
revoke all on table public.studio_projects from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.studio_projects to authenticated;
drop policy if exists studio_projects_select on public.studio_projects;
drop policy if exists studio_projects_insert on public.studio_projects;
drop policy if exists studio_projects_update on public.studio_projects;
drop policy if exists studio_projects_delete on public.studio_projects;
create policy studio_projects_select on public.studio_projects for select to authenticated using (auth.uid()=owner_id);
create policy studio_projects_insert on public.studio_projects for insert to authenticated with check (auth.uid()=owner_id);
create policy studio_projects_update on public.studio_projects for update to authenticated using (auth.uid()=owner_id) with check(auth.uid()=owner_id);
create policy studio_projects_delete on public.studio_projects for delete to authenticated using (auth.uid()=owner_id);
