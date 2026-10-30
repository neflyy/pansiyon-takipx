ALTER TABLE attendance ADD COLUMN IF NOT EXISTS notified TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch TEXT;
CREATE TABLE IF NOT EXISTS duty_log (
  id SERIAL PRIMARY KEY,
  day DATE NOT NULL,
  session TEXT NOT NULL CHECK (session IN ('etut','yat')),
  male_duty TEXT,
  female_duty TEXT,
  notes TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
