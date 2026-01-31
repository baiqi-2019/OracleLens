import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST() {
  try {
    // Try to create the table using raw SQL via supabase-js
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS evaluations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          request_id TEXT NOT NULL UNIQUE,
          oracle_name TEXT NOT NULL,
          data_type TEXT NOT NULL,
          data_value JSONB NOT NULL,
          source_url TEXT,
          reference_values JSONB,
          score INTEGER NOT NULL,
          trust_level TEXT NOT NULL,
          breakdown JSONB NOT NULL,
          formula_id TEXT NOT NULL,
          formula_name TEXT NOT NULL,
          explanation TEXT NOT NULL,
          ai_reasoning TEXT NOT NULL,
          zk_verified BOOLEAN NOT NULL DEFAULT FALSE,
          proof_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (error) {
      // If exec_sql doesn't exist, the user needs to run the migration manually
      return NextResponse.json({
        error: 'Auto-migration not available. Please run the SQL migration manually.',
        instructions: [
          '1. Go to your Supabase dashboard: https://supabase.com/dashboard',
          '2. Open the SQL Editor',
          '3. Run the SQL from: supabase/migrations/001_create_evaluations.sql',
        ],
        sqlError: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Table created successfully' });
  } catch (err) {
    return NextResponse.json({
      error: 'Setup failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check if table exists by attempting a query
    const { error } = await supabaseAdmin
      .from('evaluations')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({
        status: 'not_initialized',
        message: 'Evaluations table does not exist yet',
        action: 'POST /api/setup to create, or run SQL migration manually',
      });
    }

    // Count records
    const { count } = await supabaseAdmin
      .from('evaluations')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      status: 'ready',
      message: 'Database is connected and ready',
      evaluationCount: count || 0,
    });
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
