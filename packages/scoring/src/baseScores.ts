/**
 * OracleLens Base Scoring Functions
 *
 * Four fundamental credibility factors:
 * - S (Source): How reliable is the data source?
 * - T (Time): How fresh is the data?
 * - A (Accuracy/Consistency): Does the data align with other sources?
 * - P (Proof): Is there cryptographic verification (zkTLS)?
 *
 * All scores are normalized to [0, 1]
 */

// ============================================
// Types
// ============================================

export interface SourceInput {
  oracleName: string;
  hasApiDocumentation: boolean;
  isRegulated: boolean;
  historicalUptime?: number; // 0-100 percentage
}

export interface TimeInput {
  reportedTimestamp: number; // Unix timestamp (seconds)
  currentTimestamp: number;  // Unix timestamp (seconds)
  maxAcceptableAgeSeconds: number;
}

export interface AccuracyInput {
  primaryValue: number;
  referenceValues: number[]; // Values from other sources
  tolerancePercent: number;  // e.g., 1 means 1% tolerance
}

export interface ProofInput {
  hasZkProof: boolean;
  proofVerified: boolean;
  proofDomain?: string;
}

// ============================================
// Known Oracle Reputation Database (Mocked)
// ============================================

const ORACLE_REPUTATION: Record<string, number> = {
  'chainlink': 0.95,
  'pyth': 0.90,
  'api3': 0.85,
  'band': 0.80,
  'dia': 0.75,
  'unknown': 0.50,
};

// ============================================
// S - Source Reliability Score
// ============================================

/**
 * Calculates source reliability based on:
 * - Known oracle reputation
 * - API documentation availability
 * - Regulatory compliance
 * - Historical uptime
 */
export function calculateSourceScore(input: SourceInput): number {
  const oracleKey = input.oracleName.toLowerCase();
  const baseReputation = ORACLE_REPUTATION[oracleKey] ?? ORACLE_REPUTATION['unknown'];

  let score = baseReputation;

  // Bonus for documentation (+5%)
  if (input.hasApiDocumentation) {
    score += 0.05;
  }

  // Bonus for regulation (+5%)
  if (input.isRegulated) {
    score += 0.05;
  }

  // Factor in historical uptime if available
  if (input.historicalUptime !== undefined) {
    const uptimeFactor = input.historicalUptime / 100;
    score = score * 0.7 + uptimeFactor * 0.3;
  }

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, score));
}

// ============================================
// T - Time Freshness Score
// ============================================

/**
 * Calculates time freshness using exponential decay.
 * Score = 1.0 when data is fresh, decays towards 0 as it ages.
 *
 * Formula: e^(-age / halfLife)
 * where halfLife = maxAcceptableAge / 2
 */
export function calculateTimeScore(input: TimeInput): number {
  const ageSeconds = input.currentTimestamp - input.reportedTimestamp;

  // Future timestamps are suspicious
  if (ageSeconds < 0) {
    return 0.5; // Penalize but don't fully reject
  }

  // Data older than max acceptable age
  if (ageSeconds > input.maxAcceptableAgeSeconds) {
    // Gradual decay instead of cliff
    const overageRatio = ageSeconds / input.maxAcceptableAgeSeconds;
    return Math.max(0, 1 - (overageRatio - 1) * 0.5);
  }

  // Exponential decay within acceptable range
  const halfLife = input.maxAcceptableAgeSeconds / 2;
  const score = Math.exp(-ageSeconds / halfLife);

  return Math.max(0, Math.min(1, score));
}

// ============================================
// A - Accuracy/Consistency Score
// ============================================

/**
 * Calculates how consistent the primary value is with reference values.
 * Uses median absolute deviation for robustness against outliers.
 */
export function calculateAccuracyScore(input: AccuracyInput): number {
  if (input.referenceValues.length === 0) {
    // No references to compare - neutral score
    return 0.7;
  }

  const { primaryValue, referenceValues, tolerancePercent } = input;

  // Calculate median of reference values
  const sorted = [...referenceValues].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  // Calculate deviation from median as percentage
  const deviationPercent = Math.abs((primaryValue - median) / median) * 100;

  // Score based on how within tolerance the value is
  if (deviationPercent <= tolerancePercent) {
    // Within tolerance - high score
    return 1.0 - (deviationPercent / tolerancePercent) * 0.1;
  }

  // Outside tolerance - score drops rapidly
  const excessDeviation = deviationPercent - tolerancePercent;
  const score = 0.9 * Math.exp(-excessDeviation / tolerancePercent);

  return Math.max(0, Math.min(1, score));
}

// ============================================
// P - Proof (zkTLS) Score
// ============================================

/**
 * Calculates proof verification score.
 * Simple but important: cryptographic proof provides strong guarantees.
 */
export function calculateProofScore(input: ProofInput): number {
  if (!input.hasZkProof) {
    // No proof provided - significant penalty
    return 0.4;
  }

  if (!input.proofVerified) {
    // Proof provided but failed verification - very suspicious
    return 0.1;
  }

  // Proof verified successfully
  // Bonus if domain is a known trusted source
  const trustedDomains = [
    'api.coingecko.com',
    'api.coinmarketcap.com',
    'api.binance.com',
    'api.kraken.com',
    'pro-api.coinmarketcap.com',
  ];

  if (input.proofDomain && trustedDomains.some(d => input.proofDomain!.includes(d))) {
    return 1.0;
  }

  return 0.9;
}

// ============================================
// Utility: Score Summary
// ============================================

export interface BaseScores {
  source: number;
  time: number;
  accuracy: number;
  proof: number;
}

export function calculateAllBaseScores(
  sourceInput: SourceInput,
  timeInput: TimeInput,
  accuracyInput: AccuracyInput,
  proofInput: ProofInput
): BaseScores {
  return {
    source: calculateSourceScore(sourceInput),
    time: calculateTimeScore(timeInput),
    accuracy: calculateAccuracyScore(accuracyInput),
    proof: calculateProofScore(proofInput),
  };
}
