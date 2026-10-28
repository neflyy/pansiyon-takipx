CREATE TABLE users (id SERIAL PRIMARY KEY, role TEXT NOT NULL CHECK (role IN ('veli','bel','yon')), username TEXT UNIQUE, full_name TEXT NOT NULL, tc TEXT UNIQUE, phone TEXT, salt TEXT NOT NULL, hash TEXT NOT NULL, must_change BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE students (id SERIAL PRIMARY KEY, full_name TEXT NOT NULL, room INT NOT NULL CHECK (room BETWEEN 101 AND 315 AND room NOT IN (107,207,307)), bed INT NOT NULL CHECK (bed BETWEEN 1 AND 4), status TEXT NOT NULL DEFAULT 'yurtta' CHECK (status IN ('yurtta','izinli','etutte','revir')), parent_tc TEXT NOT NULL, phone TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE leaves (id SERIAL PRIMARY KEY, student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE, kind TEXT NOT NULL, starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL, reason TEXT, transport TEXT, address TEXT, status TEXT NOT NULL DEFAULT 'onaylandi', created_by INT REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE attendance (id SERIAL PRIMARY KEY, student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE, day DATE NOT NULL, session TEXT NOT NULL CHECK (session IN ('etut','yat')), state TEXT NOT NULL CHECK (state IN ('var','yok','gec','izinli')), taken_by INT REFERENCES users(id), UNIQUE (student_id, day, session));
CREATE TABLE audit_log (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), action TEXT NOT NULL, ip TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE login_attempts (ident TEXT PRIMARY KEY, fails INT NOT NULL DEFAULT 0, locked_until TIMESTAMPTZ);

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
