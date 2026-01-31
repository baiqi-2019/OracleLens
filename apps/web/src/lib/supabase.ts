import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client with service role key (for API routes)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Client-side client with anon key (for browser)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface EvaluationRecord {
  id?: string;
  request_id: string;
  oracle_name: string;
  data_type: string;
  data_value: Record<string, unknown>;
  source_url?: string;
  reference_values?: number[];
  score: number;
  trust_level: string;
  breakdown: Record<string, unknown>;
  formula_id: string;
  formula_name: string;
  explanation: string;
  ai_reasoning: string;
  zk_verified: boolean;
  proof_hash: string;
  created_at?: string;
}
