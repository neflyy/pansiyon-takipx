CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('veli','bel','yon')),
  scope TEXT CHECK (scope IN ('K','E')),
  username TEXT UNIQUE,
  full_name TEXT NOT NULL,
  tc TEXT UNIQUE,
  phone TEXT,
  salt TEXT NOT NULL,
  hash TEXT NOT NULL,
  must_change BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  room INT NOT NULL CHECK (room BETWEEN 101 AND 315 AND room NOT IN (107,207,307)),
  bed INT NOT NULL CHECK (bed BETWEEN 1 AND 4),
  status TEXT NOT NULL DEFAULT 'yurtta' CHECK (status IN ('yurtta','izinli','etutte','revir')),
  gender TEXT NOT NULL CHECK (gender IN ('K','E')),
  parent_tc TEXT,
  mother_name TEXT,
  mother_phone TEXT,
  father_name TEXT,
  father_phone TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE leaves (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  transport TEXT,
  address TEXT,
  requested_by_phone TEXT,
  status TEXT NOT NULL DEFAULT 'onaylandi',
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  session TEXT NOT NULL CHECK (session IN ('etut','yat')),
  state TEXT NOT NULL CHECK (state IN ('var','yok','gec','izinli')),
  taken_by INT REFERENCES users(id),
  UNIQUE (student_id, day, session)
);
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  action TEXT NOT NULL,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE login_attempts (
  ident TEXT PRIMARY KEY,
  fails INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ
);

CREATE TABLE parent_codes (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  tries INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX parent_codes_phone_idx ON parent_codes(phone, created_at);
CREATE INDEX students_mother_idx ON students(mother_phone);
CREATE INDEX students_father_idx ON students(father_phone);

CREATE TABLE wa_outbox (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX wa_outbox_status_idx ON wa_outbox(status, id);
