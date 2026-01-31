/**
 * OracleLens zkTLS Module - Data Verification
 *
 * High-level API for verifying oracle data using zkTLS proofs.
 * Wraps the Primus client with OracleLens-specific logic.
 */

import {
  ZkVerificationResult,
  AttestationResult,
  IZkTlsClient,
} from './types';
import { createZkTlsClient, generateProofHash } from './primusClient';

// ============================================
// Types for OracleLens Integration
// ============================================

export interface OracleDataForVerification {
  sourceUrl: string;
  oracleName: string;
  dataType: string;
  dataValue: Record<string, unknown>;
  userAddress?: string;
}

export interface VerificationOptions {
  templateId?: string;
  timeout?: number;
  skipIfNoCredentials?: boolean;
}

export interface OracleLensVerificationResult extends ZkVerificationResult {
  oracleName: string;
  dataType: string;
  originalData: Record<string, unknown>;
}

// ============================================
// Main Verification Function
// ============================================

/**
 * Verify oracle data source using zkTLS.
 * This is the main entry point for OracleLens zkTLS verification.
 */
export async function verifyOracleDataSource(
  data: OracleDataForVerification,
  options: VerificationOptions = {}
): Promise<OracleLensVerificationResult> {
  const client = createZkTlsClient();

  // Initialize client
  const initialized = await client.init();
  if (!initialized) {
    return {
      success: false,
      verified: false,
      proofHash: '',
      timestamp: Date.now(),
      error: 'Failed to initialize zkTLS client',
      oracleName: data.oracleName,
      dataType: data.dataType,
      originalData: data.dataValue,
    };
  }

  // Use provided user address or generate a placeholder
  const userAddress = data.userAddress ?? generatePlaceholderAddress(data.oracleName);

  // Execute full verification
  const result = await client.fullVerification(userAddress, options.templateId);

  return {
    ...result,
    oracleName: data.oracleName,
    dataType: data.dataType,
    originalData: data.dataValue,
  };
}

// ============================================
// Batch Verification
// ============================================

/**
 * Verify multiple oracle data sources in parallel.
 */
export async function verifyMultipleDataSources(
  dataList: OracleDataForVerification[],
  options: VerificationOptions = {}
): Promise<OracleLensVerificationResult[]> {
  const promises = dataList.map(data =>
    verifyOracleDataSource(data, options)
  );

  return Promise.all(promises);
}

// ============================================
// Attestation Utilities
// ============================================

/**
 * Extract verified data from an attestation result.
 */
export function extractVerifiedData(
  attestation: AttestationResult
): Record<string, unknown> | null {
  try {
    if (!attestation.data) return null;
    return JSON.parse(attestation.data);
  } catch {
    return null;
  }
}

/**
 * Check if attestation is from a trusted attestor.
 */
export function isTrustedAttestor(attestation: AttestationResult): boolean {
  const trustedDomains = [
    'primuslabs.org',
    'primus.xyz',
  ];

  return attestation.attestors?.some(attestor =>
    trustedDomains.some(domain => attestor.url?.includes(domain))
  ) ?? false;
}

/**
 * Get attestation age in seconds.
 */
export function getAttestationAge(attestation: AttestationResult): number {
  const now = Date.now();
  const attestationTime = attestation.timestamp;
  return Math.floor((now - attestationTime) / 1000);
}

/**
 * Check if attestation is still fresh (within maxAge seconds).
 */
export function isAttestationFresh(
  attestation: AttestationResult,
  maxAgeSeconds: number = 300
): boolean {
  return getAttestationAge(attestation) <= maxAgeSeconds;
}

// ============================================
// Proof Hash Utilities
// ============================================

/**
 * Verify that a proof hash matches an attestation.
 */
export function verifyProofHash(
  attestation: AttestationResult,
  expectedHash: string
): boolean {
  const actualHash = generateProofHash(attestation);
  return actualHash.toLowerCase() === expectedHash.toLowerCase();
}

/**
 * Create a compact proof summary for on-chain storage.
 */
export function createProofSummary(result: ZkVerificationResult): {
  proofHash: string;
  verified: boolean;
  timestamp: number;
  domain: string | null;
} {
  return {
    proofHash: result.proofHash,
    verified: result.verified,
    timestamp: result.timestamp,
    domain: result.verifiedDomain ?? null,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a placeholder address for verification requests.
 */
function generatePlaceholderAddress(seed: string): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return '0x' + hash.substring(0, 40);
}

// ============================================
// Pre-built Verification Templates
// ============================================

/**
 * Common verification templates for different data types.
 * These can be used as hints for template selection.
 */
export const VERIFICATION_TEMPLATES = {
  // Price feed verification
  PRICE_FEED: {
    description: 'Verify price data from exchange APIs',
    supportedSources: ['coingecko', 'coinmarketcap', 'binance', 'kraken'],
  },

  // Weather data verification
  WEATHER: {
    description: 'Verify weather data from weather APIs',
    supportedSources: ['openweathermap', 'weatherapi'],
  },

  // Sports/Event results
  SPORTS_RESULT: {
    description: 'Verify sports match results',
    supportedSources: ['espn', 'sports-reference'],
  },

  // Generic API verification
  GENERIC_API: {
    description: 'Generic HTTPS API response verification',
    supportedSources: ['*'],
  },
} as const;
