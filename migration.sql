-- Mevcut veritabanina ekleyin (Neon > SQL Editor). Tekrar calistirilabilir.
alter table students add column if not exists sinif text, add column if not exists okul_no text;
create unique index if not exists students_sinif_no on students (sinif, okul_no);
create table if not exists leave_requests (
  id serial primary key,
  ticket text unique not null,
  student_id int not null references students(id) on delete cascade,
  kind text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text, transport text, address text,
  status text not null default 'bekliyor' check (status in ('bekliyor','kod_gonderildi','onaylandi','reddedildi')),
  code_hash text,
  code_expires_at timestamptz,
  attempts int not null default 0,
  decided_by int references users(id),
  created_at timestamptz not null default now()
);
create table if not exists rate_limits (key text primary key, n int not null, t timestamptz not null default now());
