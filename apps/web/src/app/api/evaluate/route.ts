import { NextRequest, NextResponse } from 'next/server';
import { evaluateOracleData } from '@/lib/evaluate';
import { EvaluateRequest } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabase';
import { submitResultOnChain } from '@/lib/contract';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as EvaluateRequest;

    // Validate required fields
    if (!body.oracleName || !body.dataType || !body.dataValue) {
      return NextResponse.json(
        { error: 'Missing required fields: oracleName, dataType, dataValue' },
        { status: 400 }
      );
    }

    // Evaluate the oracle data
    const result = await evaluateOracleData(body);

    // Persist to Supabase
    try {
      await supabaseAdmin.from('evaluations').insert({
        request_id: result.requestId,
        oracle_name: body.oracleName,
        data_type: body.dataType,
        data_value: body.dataValue,
        source_url: body.sourceUrl || null,
        reference_values: body.referenceValues || null,
        score: result.score,
        trust_level: result.trustLevel,
        breakdown: result.breakdown,
        formula_id: result.formulaId,
        formula_name: result.formulaName,
        explanation: result.explanation,
        ai_reasoning: result.aiReasoning,
        zk_verified: result.zkVerified,
        proof_hash: result.proofHash,
      });
    } catch (dbError) {
      // Log but don't fail the request if DB write fails
      console.error('Failed to persist evaluation:', dbError);
    }

    // Submit result on-chain (non-blocking, skips if not configured)
    let onChainResult;
    try {
      onChainResult = await submitResultOnChain(
        result.requestId,
        result.score,
        result.zkVerified,
        result.proofHash
      );
    } catch (chainError) {
      console.error('On-chain submission error:', chainError);
      onChainResult = { success: false, mode: 'skipped' as const, error: 'Exception' };
    }

    return NextResponse.json({
      ...result,
      onChain: onChainResult,
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'OracleLens Evaluation API',
    usage: 'POST with { oracleName, dataType, dataValue, sourceUrl?, referenceValues? }',
    example: {
      oracleName: 'Chainlink',
      dataType: 'price_feed',
      dataValue: { asset: 'ETH/USD', price: 2500, timestamp: Date.now() },
      referenceValues: [2498, 2502, 2501],
    },
  });
}
