/**
 * Oracle Data API for zkTLS Verification
 *
 * This endpoint serves oracle data in a format that can be verified by zkTLS.
 * The Primus Labs zkTLS SDK will access this URL and create a cryptographic
 * proof that the data was fetched from this trusted server.
 *
 * Flow:
 * 1. Frontend submits evaluation request
 * 2. Backend generates a requestId and stores data temporarily
 * 3. zkTLS SDK fetches data from this endpoint
 * 4. zkTLS creates proof that data came from this HTTPS source
 * 5. Proof is stored with the evaluation result
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// In-memory store for pending verifications (production would use Redis)
const pendingVerifications = new Map<string, {
  oracleName: string;
  dataType: string;
  dataValue: Record<string, unknown>;
  sourceUrl?: string;
  referenceValues?: number[];
  createdAt: number;
}>();

// Clean up old entries (older than 5 minutes)
function cleanupOldEntries() {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  for (const [key, value] of pendingVerifications.entries()) {
    if (now - value.createdAt > maxAge) {
      pendingVerifications.delete(key);
    }
  }
}

/**
 * Store pending verification data
 */
export function storePendingVerification(
  requestId: string,
  data: {
    oracleName: string;
    dataType: string;
    dataValue: Record<string, unknown>;
    sourceUrl?: string;
    referenceValues?: number[];
  }
) {
  cleanupOldEntries();
  pendingVerifications.set(requestId, {
    ...data,
    createdAt: Date.now(),
  });
}

/**
 * GET /api/oracle-data/[requestId]
 *
 * Returns oracle data for zkTLS verification.
 * This endpoint is called by the Primus zkTLS SDK to fetch data
 * and create a cryptographic proof of the data source.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await context.params;

  // Try to get from pending verifications first
  let data = pendingVerifications.get(requestId);

  // If not found, try to get from database
  if (!data) {
    try {
      const { data: dbData, error } = await supabaseAdmin
        .from('evaluations')
        .select('oracle_name, data_type, data_value, source_url, reference_values')
        .eq('request_id', requestId)
        .single();

      if (!error && dbData) {
        data = {
          oracleName: dbData.oracle_name,
          dataType: dbData.data_type,
          dataValue: dbData.data_value,
          sourceUrl: dbData.source_url,
          referenceValues: dbData.reference_values,
          createdAt: Date.now(),
        };
      }
    } catch {
      // Ignore DB errors
    }
  }

  if (!data) {
    return NextResponse.json(
      {
        error: 'Not found',
        message: 'Oracle data not found for this request ID',
      },
      { status: 404 }
    );
  }

  // Return data in a format suitable for zkTLS verification
  const response = {
    requestId,
    oracle: {
      name: data.oracleName,
      type: data.dataType,
      verified: true,
    },
    data: data.dataValue,
    metadata: {
      source: data.sourceUrl || null,
      referenceValues: data.referenceValues || null,
      timestamp: Date.now(),
      version: '1.0.0',
    },
    signature: {
      algorithm: 'ORACLE_LENS_V1',
      server: 'oraclelens.xyz',
    },
  };

  return NextResponse.json(response, {
    headers: {
      'Content-Type': 'application/json',
      'X-OracleLens-Version': '1.0.0',
      'X-OracleLens-RequestId': requestId,
    },
  });
}
