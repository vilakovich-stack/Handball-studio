-- Handball Studio only. Run in its dedicated project, never in the club app.
begin;
create table public.studio_members (
 email text primary key check (email = lower(trim(email))),
 role text not null default 'reader' check (role in ('reader','writer')),
 status text not null default 'pending' check (status in ('pending','approved','blocked')),
 user_id uuid references auth.users(id) on delete set null,
 display_name text not null default '',
 updated_at timestamptz not null default now()
);
create table public.studio_drive_connection (
 id boolean primary key default true check (id),
 refresh_token text not null,
 owner_email text not null,
 updated_at timestamptz not null default now()
);
alter table public.studio_members enable row level security;
alter table public.studio_drive_connection enable row level security;
-- All operations go through the authenticated Edge Function. No browser role
-- can read the membership list or the owner's Drive refresh token directly.
revoke all on public.studio_members, public.studio_drive_connection from public, anon, authenticated;
grant all on public.studio_members, public.studio_drive_connection to service_role;
commit;
