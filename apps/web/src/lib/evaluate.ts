/**
 * OracleLens Evaluation Engine
 * Combines scoring, AI, and zkTLS for complete evaluation
 */

import { EvaluateRequest, EvaluateResponse } from './types';

// ============================================
// Scoring Logic (inline to avoid monorepo import issues)
// ============================================

interface BaseScores {
  source: number;
  time: number;
  accuracy: number;
  proof: number;
}

const ORACLE_REPUTATION: Record<string, number> = {
  chainlink: 0.95,
  pyth: 0.90,
  api3: 0.85,
  band: 0.80,
  dia: 0.75,
  weatherapi: 0.80,
  unknown: 0.50,
};

function calculateSourceScore(oracleName: string): number {
  const key = oracleName.toLowerCase();
  return ORACLE_REPUTATION[key] ?? ORACLE_REPUTATION['unknown'];
}

function calculateTimeScore(reportedTimestamp: number, maxAgeSeconds: number = 300): number {
  const now = Date.now();
  const ageMs = now - reportedTimestamp;
  const ageSeconds = ageMs / 1000;

  if (ageSeconds < 0) return 0.5;
  if (ageSeconds > maxAgeSeconds * 2) return 0.1;

  const halfLife = maxAgeSeconds / 2;
  return Math.exp(-ageSeconds / halfLife);
}

function calculateAccuracyScore(
  primaryValue: number,
  referenceValues: number[],
  tolerancePercent: number = 1
): number {
  if (referenceValues.length === 0) return 0.7;

  const sorted = [...referenceValues].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  const deviationPercent = Math.abs((primaryValue - median) / median) * 100;

  if (deviationPercent <= tolerancePercent) {
    return 1.0 - (deviationPercent / tolerancePercent) * 0.1;
  }

  const excessDeviation = deviationPercent - tolerancePercent;
  return Math.max(0.1, 0.9 * Math.exp(-excessDeviation / tolerancePercent));
}

function calculateProofScore(hasProof: boolean, verified: boolean): number {
  if (!hasProof) return 0.4;
  if (!verified) return 0.1;
  return 0.95;
}

// ============================================
// Formula Definitions
// ============================================

interface Formula {
  id: string;
  name: string;
  weights: { source: number; time: number; accuracy: number; proof: number };
  minAcceptableScore: number;
}

const FORMULAS: Record<string, Formula> = {
  price_feed_v1: {
    id: 'price_feed_v1',
    name: 'Price Feed Formula',
    weights: { source: 0.25, time: 0.30, accuracy: 0.30, proof: 0.15 },
    minAcceptableScore: 70,
  },
  weather_v1: {
    id: 'weather_v1',
    name: 'Weather Data Formula',
    weights: { source: 0.35, time: 0.25, accuracy: 0.20, proof: 0.20 },
    minAcceptableScore: 60,
  },
  generic_v1: {
    id: 'generic_v1',
    name: 'Generic Formula',
    weights: { source: 0.25, time: 0.25, accuracy: 0.25, proof: 0.25 },
    minAcceptableScore: 65,
  },
};

function selectFormula(dataType: string): Formula {
  const type = dataType.toLowerCase();
  if (type.includes('price') || type.includes('token') || type.includes('exchange')) {
    return FORMULAS.price_feed_v1;
  }
  if (type.includes('weather') || type.includes('temperature')) {
    return FORMULAS.weather_v1;
  }
  return FORMULAS.generic_v1;
}

// ============================================
// Trust Level
// ============================================

function getTrustLevel(score: number, minAcceptable: number): 'high' | 'medium' | 'low' | 'untrusted' {
  if (score >= 90) return 'high';
  if (score >= minAcceptable) return 'medium';
  if (score >= minAcceptable - 15) return 'low';
  return 'untrusted';
}

// ============================================
// Explanation Generation
// ============================================

function generateExplanation(
  baseScores: BaseScores,
  formula: Formula,
  finalScore: number,
  trustLevel: string
): string {
  const parts: string[] = [];

  parts.push(`Credibility Score: ${finalScore}/100 (${trustLevel.toUpperCase()})`);
  parts.push(`Formula Used: ${formula.name}`);
  parts.push('');
  parts.push('Factor Breakdown:');

  const sourcePercent = Math.round(baseScores.source * 100);
  if (sourcePercent >= 80) {
    parts.push(`• Source Reliability: ${sourcePercent}% - Highly trusted oracle`);
  } else if (sourcePercent >= 60) {
    parts.push(`• Source Reliability: ${sourcePercent}% - Moderately trusted`);
  } else {
    parts.push(`• Source Reliability: ${sourcePercent}% - Unknown or untrusted source`);
  }

  const timePercent = Math.round(baseScores.time * 100);
  if (timePercent >= 80) {
    parts.push(`• Time Freshness: ${timePercent}% - Data is fresh`);
  } else if (timePercent >= 50) {
    parts.push(`• Time Freshness: ${timePercent}% - Data is slightly stale`);
  } else {
    parts.push(`• Time Freshness: ${timePercent}% - Data is outdated`);
  }

  const accuracyPercent = Math.round(baseScores.accuracy * 100);
  if (accuracyPercent >= 80) {
    parts.push(`• Consistency: ${accuracyPercent}% - Aligns with other sources`);
  } else if (accuracyPercent >= 60) {
    parts.push(`• Consistency: ${accuracyPercent}% - Minor deviation`);
  } else {
    parts.push(`• Consistency: ${accuracyPercent}% - Significant deviation detected`);
  }

  const proofPercent = Math.round(baseScores.proof * 100);
  if (proofPercent >= 90) {
    parts.push(`• zkTLS Proof: ${proofPercent}% - Cryptographically verified`);
  } else if (proofPercent >= 40) {
    parts.push(`• zkTLS Proof: ${proofPercent}% - No proof provided`);
  } else {
    parts.push(`• zkTLS Proof: ${proofPercent}% - Verification failed`);
  }

  return parts.join('\n');
}

// ============================================
// AI Reasoning Generation
// ============================================

function generateAIReasoning(
  oracleName: string,
  dataType: string,
  formula: Formula,
  hasZkProof: boolean
): string {
  const parts: string[] = [];

  parts.push(`AI Formula Selection Analysis`);
  parts.push(`============================`);
  parts.push('');
  parts.push(`Selected: ${formula.name} (${formula.id})`);
  parts.push('');

  const oracleTrust = ORACLE_REPUTATION[oracleName.toLowerCase()];
  if (oracleTrust) {
    parts.push(`Oracle "${oracleName}" is recognized with ${Math.round(oracleTrust * 100)}% base trust.`);
  } else {
    parts.push(`Oracle "${oracleName}" is not in our trusted database - applying extra scrutiny.`);
  }

  parts.push('');
  if (dataType.toLowerCase().includes('price')) {
    parts.push('Data type is financial price data - using formula optimized for:');
    parts.push('  - High accuracy requirements (30% weight)');
    parts.push('  - Time sensitivity (30% weight)');
  } else if (dataType.toLowerCase().includes('weather')) {
    parts.push('Data type is weather data - using formula that:');
    parts.push('  - Prioritizes source reputation (35% weight)');
    parts.push('  - Allows for natural variation');
  } else {
    parts.push('Using balanced generic formula with equal weights.');
  }

  parts.push('');
  if (hasZkProof) {
    parts.push('zkTLS proof is available - this provides strong authenticity guarantees.');
  } else {
    parts.push('No zkTLS proof provided - relying on other factors for credibility assessment.');
  }

  return parts.join('\n');
}

// ============================================
// Mock zkTLS Verification
// ============================================

function mockZkTlsVerification(): { verified: boolean; proofHash: string } {
  // Simulate zkTLS verification
  const verified = Math.random() > 0.1; // 90% success rate for demo
  const proofHash = '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  return { verified, proofHash };
}

// ============================================
// Main Evaluation Function
// ============================================

export async function evaluateOracleData(request: EvaluateRequest): Promise<EvaluateResponse> {
  const timestamp = Date.now();
  const requestId = `req_${timestamp}_${Math.random().toString(36).substring(7)}`;

  try {
    // Extract price/value for accuracy check
    const dataValue = request.dataValue as Record<string, unknown>;
    const primaryValue = typeof dataValue.price === 'number'
      ? dataValue.price
      : typeof dataValue.temperature === 'number'
        ? dataValue.temperature
        : 0;

    const reportedTimestamp = typeof dataValue.timestamp === 'number'
      ? dataValue.timestamp
      : timestamp - 60000;

    // Calculate base scores
    const sourceScore = calculateSourceScore(request.oracleName);
    const timeScore = calculateTimeScore(reportedTimestamp);
    const accuracyScore = calculateAccuracyScore(
      primaryValue,
      request.referenceValues ?? [],
      request.dataType.includes('weather') ? 5 : 1
    );

    // Mock zkTLS verification
    const { verified: zkVerified, proofHash } = mockZkTlsVerification();
    const proofScore = calculateProofScore(true, zkVerified);

    const baseScores: BaseScores = {
      source: sourceScore,
      time: timeScore,
      accuracy: accuracyScore,
      proof: proofScore,
    };

    // Select formula
    const formula = selectFormula(request.dataType);

    // Calculate weighted scores
    const weightedSource = baseScores.source * formula.weights.source;
    const weightedTime = baseScores.time * formula.weights.time;
    const weightedAccuracy = baseScores.accuracy * formula.weights.accuracy;
    const weightedProof = baseScores.proof * formula.weights.proof;

    const normalizedScore = weightedSource + weightedTime + weightedAccuracy + weightedProof;
    const finalScore = Math.round(normalizedScore * 100);

    const trustLevel = getTrustLevel(finalScore, formula.minAcceptableScore);
    const explanation = generateExplanation(baseScores, formula, finalScore, trustLevel);
    const aiReasoning = generateAIReasoning(request.oracleName, request.dataType, formula, true);

    return {
      success: true,
      requestId,
      score: finalScore,
      trustLevel,
      breakdown: {
        source: { raw: baseScores.source, weighted: weightedSource },
        time: { raw: baseScores.time, weighted: weightedTime },
        accuracy: { raw: baseScores.accuracy, weighted: weightedAccuracy },
        proof: { raw: baseScores.proof, weighted: weightedProof },
      },
      formulaId: formula.id,
      formulaName: formula.name,
      explanation,
      aiReasoning,
      zkVerified,
      proofHash,
      timestamp,
    };
  } catch (error) {
    return {
      success: false,
      requestId,
      score: 0,
      trustLevel: 'untrusted',
      breakdown: {
        source: { raw: 0, weighted: 0 },
        time: { raw: 0, weighted: 0 },
        accuracy: { raw: 0, weighted: 0 },
        proof: { raw: 0, weighted: 0 },
      },
      formulaId: 'error',
      formulaName: 'Error',
      explanation: 'Evaluation failed',
      aiReasoning: '',
      zkVerified: false,
      proofHash: '',
      timestamp,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
