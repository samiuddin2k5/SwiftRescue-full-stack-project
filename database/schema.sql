
CREATE TABLE IF NOT EXISTS swiftrescue_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS swiftrescue_cases (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_age INT NOT NULL,
  blood_group TEXT,
  emergency_type TEXT NOT NULL,
  contact_number TEXT,
  notes TEXT,
  status TEXT NOT NULL,
  ambulance_driver TEXT,
  ambulance_plate TEXT,
  hospital_name TEXT,
  distance_km NUMERIC,
  amount NUMERIC,
  transaction_id TEXT,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  raw_payload JSONB
);

ALTER TABLE swiftrescue_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE swiftrescue_cases DISABLE ROW LEVEL SECURITY;
