/**
 * OracleLens Evaluation Engine
 * Combines scoring, AI, and zkTLS for complete evaluation
 */

import { EvaluateRequest, EvaluateResponse } from './types';
import { verifyOracleDataSource } from './zkTlsVerify';
import { selectFormulaWithAI, generateAIAnalysis } from './aiProvider';
import { storePendingVerification } from '@/app/api/oracle-data/[requestId]/route';

// ============================================
// Scoring Logic
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

    // Store pending verification data for zkTLS endpoint
    storePendingVerification(requestId, {
      oracleName: request.oracleName,
      dataType: request.dataType,
      dataValue: request.dataValue,
      sourceUrl: request.sourceUrl,
      referenceValues: request.referenceValues,
    });

    // zkTLS verification (uses real Primus SDK if credentials exist, otherwise mock)
    const zkResult = await verifyOracleDataSource({
      requestId,
      sourceUrl: request.sourceUrl || '',
      oracleName: request.oracleName,
      dataType: request.dataType,
      dataValue: request.dataValue,
    });
    const zkVerified = zkResult.verified;
    const proofHash = zkResult.proofHash;
    const proofScore = calculateProofScore(zkResult.success, zkVerified);

    const baseScores: BaseScores = {
      source: sourceScore,
      time: timeScore,
      accuracy: accuracyScore,
      proof: proofScore,
    };

    // AI-powered formula selection (uses Claude if credentials exist, otherwise rule-based)
    const formulaSelection = await selectFormulaWithAI(
      request.oracleName,
      request.dataType,
      request.dataValue,
      request.sourceUrl
    );
    const formula = FORMULAS[formulaSelection.formulaId] ?? FORMULAS.generic_v1;

    // Calculate weighted scores
    const weightedSource = baseScores.source * formula.weights.source;
    const weightedTime = baseScores.time * formula.weights.time;
    const weightedAccuracy = baseScores.accuracy * formula.weights.accuracy;
    const weightedProof = baseScores.proof * formula.weights.proof;

    const normalizedScore = weightedSource + weightedTime + weightedAccuracy + weightedProof;
    const finalScore = Math.round(normalizedScore * 100);

    const trustLevel = getTrustLevel(finalScore, formula.minAcceptableScore);
    const explanation = generateExplanation(baseScores, formula, finalScore, trustLevel);

    // AI-powered analysis reasoning (uses Claude if credentials exist, otherwise rule-based)
    const aiReasoning = await generateAIAnalysis({
      oracleName: request.oracleName,
      dataType: request.dataType,
      dataValue: request.dataValue,
      sourceUrl: request.sourceUrl,
      baseScores,
      zkVerified,
      finalScore,
      trustLevel,
    });

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
