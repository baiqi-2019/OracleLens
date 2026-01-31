import { NextRequest, NextResponse } from 'next/server';
import { evaluateOracleData } from '@/lib/evaluate';
import { EvaluateRequest } from '@/lib/types';

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

    return NextResponse.json(result);
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
