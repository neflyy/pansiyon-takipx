-- Mevcut veritabanını yeni sürüme yükseltir (Neon > SQL Editor)
ALTER TABLE students
  ADD COLUMN gender TEXT CHECK (gender IN ('K','E')),
  ADD COLUMN mother_name TEXT, ADD COLUMN mother_phone TEXT,
  ADD COLUMN father_name TEXT, ADD COLUMN father_phone TEXT;
ALTER TABLE students ALTER COLUMN parent_tc DROP NOT NULL;
ALTER TABLE users ADD COLUMN scope TEXT CHECK (scope IN ('K','E'));
ALTER TABLE leaves ADD COLUMN requested_by_phone TEXT;
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
