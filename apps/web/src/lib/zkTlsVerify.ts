/**
 * OracleLens zkTLS Verification Module
 *
 * Integrates with Primus Labs zkTLS SDK for cryptographic proof of data source.
 * Uses the official SDK flow as per Primus documentation.
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
  attestation?: Record<string, unknown>;
}

interface OracleDataForVerification {
  requestId: string;
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
    console.log('[zkTLS] Missing PRIMUS_APP_ID or PRIMUS_APP_SECRET');
    return false;
  }

  try {
    // Dynamic import - only works when SDK is installed
    const { PrimusZKTLS } = await import('@primuslabs/zktls-js-sdk');
    primusSdk = new PrimusZKTLS();

    // Init with appId and appSecret
    // Note: startAttestation requires browser extension (PC) or mobile app
    // Server-side attestation is not supported by the SDK
    const result = await primusSdk.init(appId, appSecret);
    primusInitialized = !!result;
    console.log('[zkTLS] Primus SDK initialized successfully, result:', result);
    console.log('[zkTLS] Note: Full attestation requires browser extension or mobile app');
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

  if (!templateId) {
    console.error('[zkTLS] Missing PRIMUS_TEMPLATE_ID');
    return {
      success: false,
      verified: false,
      proofHash: '',
      timestamp,
      mode: 'real',
      error: 'Missing PRIMUS_TEMPLATE_ID',
    };
  }

  // Generate user address from oracle name (deterministic)
  const userAddress = '0x' + createHash('sha256').update(data.oracleName + data.requestId).digest('hex').substring(0, 40);

  try {
    // Step 1: Generate attestation request with template ID and user address
    console.log(`[zkTLS] Generating request params for template: ${templateId}, user: ${userAddress}`);
    const request = primusSdk.generateRequestParams(templateId, userAddress);

    // Step 2: Set zkTLS mode (proxytls is the default)
    request.setAttMode({ algorithmType: 'proxytls' });

    // Step 3: Convert request to JSON string
    const requestStr = request.toJsonString();
    console.log('[zkTLS] Request params generated');

    // Step 4: Sign the request with appSecret
    const signedRequestStr = await primusSdk.sign(requestStr);
    console.log('[zkTLS] Request signed successfully');

    // Step 5: Start attestation process
    // Note: This requires browser extension on PC platform
    // For server-side, we need to handle this differently
    console.log('[zkTLS] Starting attestation...');
    const attestation = await primusSdk.startAttestation(signedRequestStr);
    console.log('[zkTLS] Attestation received:', JSON.stringify(attestation, null, 2));

    // Step 6: Verify the attestation signature
    const verifyResult = primusSdk.verifyAttestation(attestation);
    console.log('[zkTLS] Verification result:', verifyResult);

    // Generate proof hash from attestation data
    const proofHash = '0x' + createHash('sha256')
      .update(JSON.stringify({
        recipient: attestation.recipient,
        data: attestation.data,
        timestamp: attestation.timestamp,
        signatures: attestation.signatures,
      }))
      .digest('hex');

    // Extract domain from attestation
    let verifiedDomain: string | undefined;
    try {
      const attUrl = attestation.request?.url || attestation.url || data.sourceUrl;
      if (attUrl) {
        verifiedDomain = new URL(attUrl).hostname;
      }
    } catch { /* ignore */ }

    console.log(`[zkTLS] Attestation complete: verified=${verifyResult}, domain=${verifiedDomain}, proofHash=${proofHash}`);

    return {
      success: true,
      verified: verifyResult === true,
      proofHash,
      verifiedDomain,
      timestamp,
      mode: 'real',
      attestation: attestation as Record<string, unknown>,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Primus verification failed';
    console.error('[zkTLS] Real verification failed:', errorMessage);

    // Check for specific error types
    if (errorMessage.includes('window') || errorMessage.includes('postMessage')) {
      console.log('[zkTLS] Browser extension required for attestation, falling back to mock');
      return mockVerification(data);
    }

    return {
      success: false,
      verified: false,
      proofHash: '',
      timestamp,
      mode: 'real',
      error: errorMessage,
    };
  }
}

// ============================================
// Mock Verification (used when no credentials or browser not available)
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

  console.log(`[zkTLS] Mock verification: verified=${verified}, proofHash=${proofHash}`);

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
  console.log('[zkTLS] Starting verification for:', data.oracleName, data.dataType);
  console.log('[zkTLS] Environment check - PRIMUS_APP_ID:', process.env.PRIMUS_APP_ID ? 'set' : 'not set');
  console.log('[zkTLS] Environment check - PRIMUS_APP_SECRET:', process.env.PRIMUS_APP_SECRET ? 'set' : 'not set');
  console.log('[zkTLS] Environment check - PRIMUS_TEMPLATE_ID:', process.env.PRIMUS_TEMPLATE_ID ? 'set' : 'not set');

  // Try to initialize real SDK (only once)
  if (!primusInitialized && process.env.PRIMUS_APP_ID && process.env.PRIMUS_APP_SECRET) {
    await initPrimusSdk();
  }

  // Use real SDK if available
  if (primusInitialized && primusSdk) {
    console.log('[zkTLS] Using real Primus SDK for verification');
    return realPrimusVerification(data);
  }

  // Fall back to mock
  console.log('[zkTLS] Using mock verification (Primus SDK not available)');
  return mockVerification(data);
}
