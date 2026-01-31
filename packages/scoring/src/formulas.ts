/**
 * OracleLens Credibility Formulas
 *
 * Each formula defines:
 * - Unique ID
 * - Description
 * - Weights for S, T, A, P factors
 * - Applicable data types
 *
 * Formula types:
 * 1. price_feed_v1    - Financial price data (high accuracy, freshness critical)
 * 2. weather_v1       - Weather data (moderate tolerance, source matters)
 * 3. policy_v1        - Governance/policy data (source critical, time less so)
 * 4. prediction_v1    - Prediction market outcomes (proof critical)
 * 5. private_v1       - Private/sensitive data (maximum proof requirement)
 */

import { BaseScores } from './baseScores';

// ============================================
// Types
// ============================================

export interface FormulaWeights {
  source: number;    // S weight
  time: number;      // T weight
  accuracy: number;  // A weight
  proof: number;     // P weight
}

export interface Formula {
  id: string;
  name: string;
  description: string;
  weights: FormulaWeights;
  applicableDataTypes: string[];
  minAcceptableScore: number; // Threshold for "trustworthy"
}

export interface ScoringResult {
  formulaId: string;
  finalScore: number;           // 0-100
  normalizedScore: number;      // 0-1
  breakdown: {
    source: { raw: number; weighted: number };
    time: { raw: number; weighted: number };
    accuracy: { raw: number; weighted: number };
    proof: { raw: number; weighted: number };
  };
  trustLevel: 'high' | 'medium' | 'low' | 'untrusted';
  explanation: string;
}

// ============================================
// Formula Definitions
// ============================================

export const FORMULAS: Record<string, Formula> = {
  price_feed_v1: {
    id: 'price_feed_v1',
    name: 'Price Feed Formula',
    description: 'For financial price data where accuracy and freshness are critical',
    weights: {
      source: 0.25,
      time: 0.30,
      accuracy: 0.30,
      proof: 0.15,
    },
    applicableDataTypes: ['price_feed', 'exchange_rate', 'token_price'],
    minAcceptableScore: 70,
  },

  weather_v1: {
    id: 'weather_v1',
    name: 'Weather Data Formula',
    description: 'For weather data with moderate tolerance for variation',
    weights: {
      source: 0.35,
      time: 0.25,
      accuracy: 0.20,
      proof: 0.20,
    },
    applicableDataTypes: ['weather', 'temperature', 'precipitation'],
    minAcceptableScore: 60,
  },

  policy_v1: {
    id: 'policy_v1',
    name: 'Policy/Governance Formula',
    description: 'For governance decisions where source authority is paramount',
    weights: {
      source: 0.45,
      time: 0.10,
      accuracy: 0.15,
      proof: 0.30,
    },
    applicableDataTypes: ['policy', 'governance', 'voting', 'regulation'],
    minAcceptableScore: 75,
  },

  prediction_v1: {
    id: 'prediction_v1',
    name: 'Prediction Market Formula',
    description: 'For prediction market outcomes where proof of result is critical',
    weights: {
      source: 0.20,
      time: 0.15,
      accuracy: 0.25,
      proof: 0.40,
    },
    applicableDataTypes: ['prediction', 'outcome', 'event_result', 'sports'],
    minAcceptableScore: 80,
  },

  private_v1: {
    id: 'private_v1',
    name: 'Private Data Formula',
    description: 'For sensitive data requiring maximum verification',
    weights: {
      source: 0.15,
      time: 0.10,
      accuracy: 0.20,
      proof: 0.55,
    },
    applicableDataTypes: ['private', 'sensitive', 'confidential', 'kyc'],
    minAcceptableScore: 85,
  },

  generic_v1: {
    id: 'generic_v1',
    name: 'Generic Formula',
    description: 'Balanced formula for unclassified data types',
    weights: {
      source: 0.25,
      time: 0.25,
      accuracy: 0.25,
      proof: 0.25,
    },
    applicableDataTypes: ['*'],
    minAcceptableScore: 65,
  },
};

// ============================================
// Formula Selection
// ============================================

/**
 * Select the most appropriate formula for a given data type.
 * Returns generic formula if no specific match found.
 */
export function selectFormula(dataType: string): Formula {
  const normalizedType = dataType.toLowerCase();

  for (const formula of Object.values(FORMULAS)) {
    if (formula.id === 'generic_v1') continue; // Check generic last

    if (formula.applicableDataTypes.includes(normalizedType)) {
      return formula;
    }
  }

  return FORMULAS.generic_v1;
}

/**
 * Get a formula by its ID.
 */
export function getFormulaById(formulaId: string): Formula | undefined {
  return FORMULAS[formulaId];
}

// ============================================
// Score Calculation
// ============================================

/**
 * Calculate final credibility score using a specific formula.
 */
export function calculateCredibilityScore(
  baseScores: BaseScores,
  formula: Formula
): ScoringResult {
  const { weights } = formula;

  // Calculate weighted scores
  const weightedSource = baseScores.source * weights.source;
  const weightedTime = baseScores.time * weights.time;
  const weightedAccuracy = baseScores.accuracy * weights.accuracy;
  const weightedProof = baseScores.proof * weights.proof;

  // Sum to get normalized score (0-1)
  const normalizedScore = weightedSource + weightedTime + weightedAccuracy + weightedProof;

  // Convert to 0-100 scale
  const finalScore = Math.round(normalizedScore * 100);

  // Determine trust level
  const trustLevel = getTrustLevel(finalScore, formula.minAcceptableScore);

  // Generate explanation
  const explanation = generateExplanation(baseScores, formula, finalScore, trustLevel);

  return {
    formulaId: formula.id,
    finalScore,
    normalizedScore,
    breakdown: {
      source: { raw: baseScores.source, weighted: weightedSource },
      time: { raw: baseScores.time, weighted: weightedTime },
      accuracy: { raw: baseScores.accuracy, weighted: weightedAccuracy },
      proof: { raw: baseScores.proof, weighted: weightedProof },
    },
    trustLevel,
    explanation,
  };
}

// ============================================
// Trust Level Classification
// ============================================

function getTrustLevel(
  score: number,
  minAcceptable: number
): 'high' | 'medium' | 'low' | 'untrusted' {
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

  // Overall assessment
  parts.push(`Credibility Score: ${finalScore}/100 (${trustLevel.toUpperCase()})`);
  parts.push(`Formula: ${formula.name}`);
  parts.push('');

  // Factor breakdown
  parts.push('Factor Analysis:');

  // Source
  const sourcePercent = Math.round(baseScores.source * 100);
  if (sourcePercent >= 80) {
    parts.push(`• Source Reliability: ${sourcePercent}% - Highly trusted oracle source`);
  } else if (sourcePercent >= 60) {
    parts.push(`• Source Reliability: ${sourcePercent}% - Moderately trusted source`);
  } else {
    parts.push(`• Source Reliability: ${sourcePercent}% - Source lacks established reputation`);
  }

  // Time
  const timePercent = Math.round(baseScores.time * 100);
  if (timePercent >= 80) {
    parts.push(`• Time Freshness: ${timePercent}% - Data is recent and timely`);
  } else if (timePercent >= 50) {
    parts.push(`• Time Freshness: ${timePercent}% - Data is somewhat stale`);
  } else {
    parts.push(`• Time Freshness: ${timePercent}% - Data is outdated`);
  }

  // Accuracy
  const accuracyPercent = Math.round(baseScores.accuracy * 100);
  if (accuracyPercent >= 80) {
    parts.push(`• Consistency: ${accuracyPercent}% - Aligns well with other sources`);
  } else if (accuracyPercent >= 60) {
    parts.push(`• Consistency: ${accuracyPercent}% - Minor deviations from other sources`);
  } else {
    parts.push(`• Consistency: ${accuracyPercent}% - Significant deviation from other sources`);
  }

  // Proof
  const proofPercent = Math.round(baseScores.proof * 100);
  if (proofPercent >= 90) {
    parts.push(`• zkTLS Proof: ${proofPercent}% - Cryptographically verified`);
  } else if (proofPercent >= 40) {
    parts.push(`• zkTLS Proof: ${proofPercent}% - No proof provided`);
  } else {
    parts.push(`• zkTLS Proof: ${proofPercent}% - Proof verification failed`);
  }

  // Recommendation
  parts.push('');
  if (trustLevel === 'high') {
    parts.push('Recommendation: Data is highly credible and safe to use.');
  } else if (trustLevel === 'medium') {
    parts.push('Recommendation: Data is reasonably credible, proceed with normal caution.');
  } else if (trustLevel === 'low') {
    parts.push('Recommendation: Data has credibility concerns, use with caution.');
  } else {
    parts.push('Recommendation: Data credibility is insufficient, additional verification required.');
  }

  return parts.join('\n');
}

// ============================================
// Convenience Function
// ============================================

/**
 * One-stop function to calculate credibility score.
 * Automatically selects formula based on data type.
 */
export function evaluateCredibility(
  dataType: string,
  baseScores: BaseScores,
  formulaIdOverride?: string
): ScoringResult {
  const formula = formulaIdOverride
    ? (getFormulaById(formulaIdOverride) ?? selectFormula(dataType))
    : selectFormula(dataType);

  return calculateCredibilityScore(baseScores, formula);
}
