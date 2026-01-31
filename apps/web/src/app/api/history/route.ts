import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const oracleName = searchParams.get('oracle');
    const trustLevel = searchParams.get('trust');

    let query = supabaseAdmin
      .from('evaluations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (oracleName) {
      query = query.ilike('oracle_name', `%${oracleName}%`);
    }
    if (trustLevel) {
      query = query.eq('trust_level', trustLevel);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch evaluation history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      evaluations: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
