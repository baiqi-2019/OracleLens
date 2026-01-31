/**
 * OracleLens AI Module - Formula Selection
 *
 * AI-assisted selection of the most appropriate credibility formula.
 * Uses pattern matching and heuristics to determine which formula fits best.
 *
 * IMPORTANT: AI does NOT calculate scores. It only:
 * 1. Selects which formula to use
 * 2. Suggests minor weight adjustments
 * 3. Explains its reasoning in plain English
 */

import {
  OracleDataContext,
  FormulaSelectionResult,
  GeneratedFormula,
  AIProvider,
} from './types';
import { generateCustomFormula } from './generateFormula';

// ============================================
// Formula Selection Logic
// ============================================

/**
 * Known data type patterns and their formula mappings.
 * This is the "knowledge base" that AI uses for selection.
 */
const DATA_TYPE_PATTERNS: Array<{
  patterns: RegExp[];
  formulaId: string;
  baseConfidence: 'high' | 'medium';
  description: string;
}> = [
  {
    patterns: [/price/i, /rate/i, /token/i, /exchange/i, /forex/i, /stock/i],
    formulaId: 'price_feed_v1',
    baseConfidence: 'high',
    description: 'Financial price data requires high accuracy and freshness',
  },
  {
    patterns: [/weather/i, /temperature/i, /humidity/i, /precipitation/i, /climate/i],
    formulaId: 'weather_v1',
    baseConfidence: 'high',
    description: 'Weather data tolerates more variation but source matters',
  },
  {
    patterns: [/governance/i, /policy/i, /vote/i, /regulation/i, /law/i, /ruling/i],
    formulaId: 'policy_v1',
    baseConfidence: 'high',
    description: 'Governance data prioritizes source authority',
  },
  {
    patterns: [/prediction/i, /outcome/i, /result/i, /sport/i, /event/i, /match/i, /game/i],
    formulaId: 'prediction_v1',
    baseConfidence: 'high',
    description: 'Prediction outcomes require strong proof verification',
  },
  {
    patterns: [/private/i, /sensitive/i, /kyc/i, /identity/i, /confidential/i, /personal/i],
    formulaId: 'private_v1',
    baseConfidence: 'high',
    description: 'Private data requires maximum proof verification',
  },
];

/**
 * Oracle reputation database for trust adjustments.
 */
const ORACLE_TRUST_LEVELS: Record<string, 'high' | 'medium' | 'low'> = {
  chainlink: 'high',
  pyth: 'high',
  api3: 'medium',
  band: 'medium',
  dia: 'medium',
};

// ============================================
// Mock AI Provider
// ============================================

/**
 * Mock AI provider that uses rule-based logic.
 * This simulates what a real AI would do, making it easy to test
 * and understand the decision process.
 */
export class MockAIProvider implements AIProvider {
  name = 'MockAI';

  async selectFormula(context: OracleDataContext): Promise<FormulaSelectionResult> {
    // Step 1: Find matching formula based on data type
    const match = this.findMatchingFormula(context.dataType);

    // Step 2: Determine confidence based on context
    const confidence = this.calculateConfidence(context, match);

    // Step 3: Calculate weight adjustments based on context
    const adjustments = this.calculateWeightAdjustments(context);

    // Step 4: Generate human-readable reasoning
    const reasoning = this.generateReasoning(context, match, adjustments);

    return {
      formulaId: match.formulaId,
      confidence,
      reasoning,
      weightAdjustments: adjustments.weights,
      adjustmentReasoning: adjustments.reasoning,
    };
  }

  async generateFormula(
    context: OracleDataContext,
    reason: string
  ): Promise<GeneratedFormula> {
    return generateCustomFormula(context, reason);
  }

  /**
   * Find the best matching formula for a data type.
   */
  private findMatchingFormula(dataType: string): {
    formulaId: string;
    baseConfidence: 'high' | 'medium';
    description: string;
  } {
    for (const pattern of DATA_TYPE_PATTERNS) {
      if (pattern.patterns.some(p => p.test(dataType))) {
        return {
          formulaId: pattern.formulaId,
          baseConfidence: pattern.baseConfidence,
          description: pattern.description,
        };
      }
    }

    // Default to generic formula
    return {
      formulaId: 'generic_v1',
      baseConfidence: 'medium',
      description: 'No specific pattern matched, using balanced generic formula',
    };
  }

  /**
   * Calculate confidence based on multiple factors.
   */
  private calculateConfidence(
    context: OracleDataContext,
    match: { baseConfidence: 'high' | 'medium' }
  ): 'high' | 'medium' | 'low' {
    let confidenceScore = match.baseConfidence === 'high' ? 3 : 2;

    // Boost confidence if oracle is known and trusted
    const oracleTrust = ORACLE_TRUST_LEVELS[context.oracleName.toLowerCase()];
    if (oracleTrust === 'high') confidenceScore += 1;
    if (oracleTrust === 'low') confidenceScore -= 1;

    // Boost confidence if zkTLS proof is available and verified
    if (context.hasZkProof && context.proofVerified) {
      confidenceScore += 1;
    }

    // Reduce confidence if no reference data available
    if (!context.referenceDataAvailable) {
      confidenceScore -= 1;
    }

    // Map score to confidence level
    if (confidenceScore >= 4) return 'high';
    if (confidenceScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Calculate suggested weight adjustments based on context.
   */
  private calculateWeightAdjustments(context: OracleDataContext): {
    weights?: {
      source?: number;
      time?: number;
      accuracy?: number;
      proof?: number;
    };
    reasoning?: string;
  } {
    const adjustments: {
      source?: number;
      time?: number;
      accuracy?: number;
      proof?: number;
    } = {};
    const reasons: string[] = [];

    // If zkTLS proof is verified, slightly increase proof weight
    if (context.hasZkProof && context.proofVerified) {
      adjustments.proof = 0.05;
      reasons.push('zkTLS proof verified - increased proof weight');
    }

    // If oracle is unknown, increase source weight for more scrutiny
    if (!ORACLE_TRUST_LEVELS[context.oracleName.toLowerCase()]) {
      adjustments.source = 0.05;
      reasons.push('Unknown oracle - increased source weight for scrutiny');
    }

    // If no reference data, decrease accuracy weight (can\'t verify)
    if (!context.referenceDataAvailable) {
      adjustments.accuracy = -0.05;
      reasons.push('No reference data - decreased accuracy weight');
    }

    // If user provided a hint about time sensitivity
    if (context.userHint?.toLowerCase().includes('time-sensitive')) {
      adjustments.time = 0.05;
      reasons.push('User indicated time-sensitive data - increased time weight');
    }

    if (Object.keys(adjustments).length === 0) {
      return {};
    }

    return {
      weights: adjustments,
      reasoning: reasons.join('. ') + '.',
    };
  }

  /**
   * Generate human-readable explanation of the decision.
   */
  private generateReasoning(
    context: OracleDataContext,
    match: { formulaId: string; description: string },
    adjustments: { reasoning?: string }
  ): string {
    const parts: string[] = [];

    // Explain formula selection
    parts.push(`Selected formula: ${match.formulaId}`);
    parts.push(`Reason: ${match.description}`);

    // Explain oracle context
    const oracleTrust = ORACLE_TRUST_LEVELS[context.oracleName.toLowerCase()];
    if (oracleTrust) {
      parts.push(`Oracle "${context.oracleName}" has ${oracleTrust} trust level in our database.`);
    } else {
      parts.push(`Oracle "${context.oracleName}" is not in our trusted database - extra scrutiny applied.`);
    }

    // Explain proof status
    if (context.hasZkProof) {
      if (context.proofVerified) {
        parts.push('zkTLS proof is available and verified - this significantly boosts credibility.');
      } else {
        parts.push('zkTLS proof is available but NOT verified - this is a red flag.');
      }
    } else {
      parts.push('No zkTLS proof provided - credibility assessment relies on other factors.');
    }

    // Explain any adjustments
    if (adjustments.reasoning) {
      parts.push(`Weight adjustments: ${adjustments.reasoning}`);
    }

    return parts.join('\n');
  }
}

// ============================================
// Main Selection Function
// ============================================

/**
 * Select the best formula for given oracle data context.
 * Uses the configured AI provider (defaults to MockAI).
 */
export async function selectFormulaWithAI(
  context: OracleDataContext,
  provider?: AIProvider
): Promise<FormulaSelectionResult> {
  const aiProvider = provider ?? new MockAIProvider();
  return aiProvider.selectFormula(context);
}

// ============================================
// Utility: Apply Weight Adjustments
// ============================================

/**
 * Apply AI-suggested weight adjustments to base weights.
 * Ensures weights still sum to 1.0 after adjustments.
 */
export function applyWeightAdjustments(
  baseWeights: { source: number; time: number; accuracy: number; proof: number },
  adjustments?: { source?: number; time?: number; accuracy?: number; proof?: number }
): { source: number; time: number; accuracy: number; proof: number } {
  if (!adjustments) return baseWeights;

  // Apply adjustments
  let adjusted = {
    source: baseWeights.source + (adjustments.source ?? 0),
    time: baseWeights.time + (adjustments.time ?? 0),
    accuracy: baseWeights.accuracy + (adjustments.accuracy ?? 0),
    proof: baseWeights.proof + (adjustments.proof ?? 0),
  };

  // Clamp individual weights to [0.05, 0.7]
  adjusted = {
    source: Math.max(0.05, Math.min(0.7, adjusted.source)),
    time: Math.max(0.05, Math.min(0.7, adjusted.time)),
    accuracy: Math.max(0.05, Math.min(0.7, adjusted.accuracy)),
    proof: Math.max(0.05, Math.min(0.7, adjusted.proof)),
  };

  // Normalize to sum to 1.0
  const sum = adjusted.source + adjusted.time + adjusted.accuracy + adjusted.proof;
  return {
    source: adjusted.source / sum,
    time: adjusted.time / sum,
    accuracy: adjusted.accuracy / sum,
    proof: adjusted.proof / sum,
  };
}
