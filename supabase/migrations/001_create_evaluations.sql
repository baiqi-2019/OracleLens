-- OracleLens Evaluations Table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/bntunapsarvvkgktnbhb/sql

CREATE TABLE IF NOT EXISTS evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  oracle_name TEXT NOT NULL,
  data_type TEXT NOT NULL,
  data_value JSONB NOT NULL,
  source_url TEXT,
  reference_values JSONB,
  score INTEGER NOT NULL,
  trust_level TEXT NOT NULL CHECK (trust_level IN ('high', 'medium', 'low', 'untrusted')),
  breakdown JSONB NOT NULL,
  formula_id TEXT NOT NULL,
  formula_name TEXT NOT NULL,
  explanation TEXT NOT NULL,
  ai_reasoning TEXT NOT NULL,
  zk_verified BOOLEAN NOT NULL DEFAULT FALSE,
  proof_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_evaluations_request_id ON evaluations(request_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_oracle_name ON evaluations(oracle_name);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_trust_level ON evaluations(trust_level);

-- Enable Row Level Security
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read evaluations (public data)
CREATE POLICY "Anyone can read evaluations" ON evaluations
  FOR SELECT USING (true);

-- Only service role can insert (from API)
CREATE POLICY "Service role can insert evaluations" ON evaluations
  FOR INSERT WITH CHECK (true);
