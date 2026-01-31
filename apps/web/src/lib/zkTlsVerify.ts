/**
 * OracleLens zkTLS Verification Module
 *
 * Integrates with Primus Labs zkTLS SDK for cryptographic proof of data source.
 * Automatically falls back to mock mode when credentials are not available.
 *
 * Environment Variables:
 * - PRIMUS_APP_ID: Application ID from Primus Developer Hub
 * - PRIMUS_APP_SECRET: Application secret
 * - PRIMUS_TEMPLATE_ID: Default template ID for attestations
 */

import { createHash } from 'crypto';

// ============================================
// Types
// ============================================

interface ZkVerificationResult {
  success: boolean;
  verified: boolean;
  proofHash: string;
  verifiedDomain?: string;
  timestamp: number;
  mode: 'real' | 'mock';
  error?: string;
}

interface OracleDataForVerification {
  sourceUrl: string;
  oracleName: string;
  dataType: string;
  dataValue: Record<string, unknown>;
}

// ============================================
// Primus SDK Integration
// ============================================

let primusSdk: any = null;
let primusInitialized = false;

async function initPrimusSdk(): Promise<boolean> {
  const appId = process.env.PRIMUS_APP_ID;
  const appSecret = process.env.PRIMUS_APP_SECRET;

  if (!appId || !appSecret) {
    return false;
  }

  try {
    // Dynamic import - only works when SDK is installed
    const { PrimusZKTLS } = await import('@primuslabs/zktls-js-sdk');
    primusSdk = new PrimusZKTLS();
    const result = await primusSdk.init(appId, appSecret, { platform: 'pc' });
    primusInitialized = !!result;
    console.log('[zkTLS] Primus SDK initialized successfully');
    return primusInitialized;
  } catch (error) {
    console.log('[zkTLS] Primus SDK not available, using mock mode:',
      error instanceof Error ? error.message : 'unknown error');
    return false;
  }
}

async function realPrimusVerification(
  data: OracleDataForVerification
): Promise<ZkVerificationResult> {
  const timestamp = Date.now();
  const templateId = process.env.PRIMUS_TEMPLATE_ID;
  const userAddress = '0x' + createHash('sha256').update(data.oracleName).digest('hex').substring(0, 40);

  try {
    // Generate attestation request
    const request = primusSdk.generateRequestParams(templateId, userAddress);
    request.setAttMode({ algorithmType: 'proxytls' });
    const requestStr = request.toJsonString();
    const signedRequest = await primusSdk.sign(requestStr);

    // Execute attestation
    const attestation = await primusSdk.startAttestation(signedRequest);

    // Verify attestation
    const verified = await primusSdk.verifyAttestation(attestation);

    // Generate proof hash
    const proofHash = '0x' + createHash('sha256')
      .update(JSON.stringify({
        recipient: attestation.recipient,
        data: attestation.data,
        timestamp: attestation.timestamp,
        signatures: attestation.signatures,
      }))
      .digest('hex');

    // Extract domain
    let verifiedDomain: string | undefined;
    try {
      verifiedDomain = new URL(attestation.request?.url).hostname;
    } catch { /* ignore */ }

    return {
      success: true,
      verified: verified === true,
      proofHash,
      verifiedDomain,
      timestamp,
      mode: 'real',
    };
  } catch (error) {
    return {
      success: false,
      verified: false,
      proofHash: '',
      timestamp,
      mode: 'real',
      error: error instanceof Error ? error.message : 'Primus verification failed',
    };
  }
}

// ============================================
// Mock Verification (used when no credentials)
// ============================================

function mockVerification(
  data: OracleDataForVerification
): ZkVerificationResult {
  const timestamp = Date.now();

  // Deterministic mock based on oracle name for consistent demo results
  const seed = data.oracleName + data.dataType + JSON.stringify(data.dataValue);
  const hash = createHash('sha256').update(seed).digest('hex');

  // Use hash to determine verification result (deterministic but varied)
  const hashNum = parseInt(hash.substring(0, 8), 16);
  const verified = hashNum % 10 !== 0; // ~90% success rate

  const proofHash = '0x' + createHash('sha256')
    .update(seed + timestamp)
    .digest('hex');

  let verifiedDomain: string | undefined;
  if (data.sourceUrl) {
    try {
      verifiedDomain = new URL(data.sourceUrl).hostname;
    } catch { /* ignore */ }
  }

  return {
    success: true,
    verified,
    proofHash,
    verifiedDomain,
    timestamp,
    mode: 'mock',
  };
}

// ============================================
// Main Export
// ============================================

/**
 * Verify oracle data source using zkTLS.
 * Automatically uses real Primus SDK if credentials are configured,
 * otherwise falls back to mock verification.
 */
export async function verifyOracleDataSource(
  data: OracleDataForVerification
): Promise<ZkVerificationResult> {
  // Try to initialize real SDK (only once)
  if (!primusInitialized && process.env.PRIMUS_APP_ID) {
    await initPrimusSdk();
  }

  // Use real SDK if available
  if (primusInitialized && primusSdk) {
    console.log('[zkTLS] Using real Primus SDK for verification');
    return realPrimusVerification(data);
  }

  // Fall back to mock
  console.log('[zkTLS] Using mock verification (no Primus credentials)');
  return mockVerification(data);
}
