/**
 * OracleLens AI Module - Custom Formula Generation
 *
 * When existing formulas don't fit, AI can generate a custom formula
 * with appropriate weights for the specific use case.
 *
 * IMPORTANT: Generated formulas still use the same S, T, A, P factors.
 * AI only determines the WEIGHTS, not the scoring logic itself.
 */

import { OracleDataContext, GeneratedFormula } from './types';

// ============================================
// Formula Generation Templates
// ============================================

/**
 * Base templates for different data categories.
 * AI starts from these and adjusts based on context.
 */
const FORMULA_TEMPLATES: Record<string, {
  baseWeights: { source: number; time: number; accuracy: number; proof: number };
  minScore: number;
  traits: string[];
}> = {
  financial: {
    baseWeights: { source: 0.25, time: 0.30, accuracy: 0.30, proof: 0.15 },
    minScore: 70,
    traits: ['high accuracy requirement', 'time-sensitive', 'regulated sources preferred'],
  },
  environmental: {
    baseWeights: { source: 0.35, time: 0.25, accuracy: 0.20, proof: 0.20 },
    minScore: 60,
    traits: ['source reputation important', 'moderate time sensitivity', 'natural variation expected'],
  },
  governance: {
    baseWeights: { source: 0.45, time: 0.10, accuracy: 0.15, proof: 0.30 },
    minScore: 75,
    traits: ['source authority critical', 'immutable once published', 'proof of authenticity valued'],
  },
  event_outcome: {
    baseWeights: { source: 0.20, time: 0.15, accuracy: 0.25, proof: 0.40 },
    minScore: 80,
    traits: ['proof is paramount', 'binary outcomes', 'disputes possible'],
  },
  sensitive: {
    baseWeights: { source: 0.15, time: 0.10, accuracy: 0.20, proof: 0.55 },
    minScore: 85,
    traits: ['maximum verification required', 'privacy-sensitive', 'legal implications'],
  },
  balanced: {
    baseWeights: { source: 0.25, time: 0.25, accuracy: 0.25, proof: 0.25 },
    minScore: 65,
    traits: ['general purpose', 'no specific bias', 'adaptable'],
  },
};

// ============================================
// Context Analysis
// ============================================

/**
 * Analyze context to determine appropriate template and adjustments.
 */
function analyzeContext(context: OracleDataContext, reason: string): {
  template: keyof typeof FORMULA_TEMPLATES;
  adjustments: { source: number; time: number; accuracy: number; proof: number };
  analysisNotes: string[];
} {
  const notes: string[] = [];
  let template: keyof typeof FORMULA_TEMPLATES = 'balanced';
  const adjustments = { source: 0, time: 0, accuracy: 0, proof: 0 };

  // Analyze the reason for custom formula
  const reasonLower = reason.toLowerCase();

  // Detect category from reason
  if (reasonLower.includes('financial') || reasonLower.includes('price') || reasonLower.includes('trading')) {
    template = 'financial';
    notes.push('Detected financial context from user reason');
  } else if (reasonLower.includes('environment') || reasonLower.includes('weather') || reasonLower.includes('sensor')) {
    template = 'environmental';
    notes.push('Detected environmental context from user reason');
  } else if (reasonLower.includes('governance') || reasonLower.includes('vote') || reasonLower.includes('policy')) {
    template = 'governance';
    notes.push('Detected governance context from user reason');
  } else if (reasonLower.includes('event') || reasonLower.includes('outcome') || reasonLower.includes('result')) {
    template = 'event_outcome';
    notes.push('Detected event outcome context from user reason');
  } else if (reasonLower.includes('sensitive') || reasonLower.includes('private') || reasonLower.includes('kyc')) {
    template = 'sensitive';
    notes.push('Detected sensitive data context from user reason');
  }

  // Adjust based on zkTLS availability
  if (context.hasZkProof) {
    if (context.proofVerified) {
      adjustments.proof += 0.05;
      notes.push('zkTLS proof verified - boosted proof weight');
    } else {
      adjustments.proof -= 0.05;
      adjustments.source += 0.05;
      notes.push('zkTLS proof failed - shifted weight to source scrutiny');
    }
  } else {
    adjustments.proof -= 0.05;
    adjustments.accuracy += 0.05;
    notes.push('No zkTLS proof - shifted weight to accuracy checking');
  }

  // Adjust based on reference data availability
  if (!context.referenceDataAvailable) {
    adjustments.accuracy -= 0.05;
    adjustments.source += 0.03;
    adjustments.proof += 0.02;
    notes.push('No reference data - reduced accuracy weight, increased source/proof');
  }

  // Adjust based on time keywords in reason
  if (reasonLower.includes('real-time') || reasonLower.includes('time-critical')) {
    adjustments.time += 0.10;
    notes.push('Time-critical requirement - boosted time weight');
  }

  // Adjust based on trust keywords in reason
  if (reasonLower.includes('untrusted') || reasonLower.includes('unknown source')) {
    adjustments.source += 0.10;
    notes.push('Trust concerns mentioned - boosted source weight');
  }

  return { template, adjustments, analysisNotes: notes };
}

// ============================================
// Generate Custom Formula
// ============================================

/**
 * Generate a custom formula based on context and user-provided reason.
 */
export async function generateCustomFormula(
  context: OracleDataContext,
  reason: string
): Promise<GeneratedFormula> {
  // Analyze context
  const { template, adjustments, analysisNotes } = analyzeContext(context, reason);
  const baseTemplate = FORMULA_TEMPLATES[template];

  // Apply adjustments to base weights
  let weights = {
    source: baseTemplate.baseWeights.source + adjustments.source,
    time: baseTemplate.baseWeights.time + adjustments.time,
    accuracy: baseTemplate.baseWeights.accuracy + adjustments.accuracy,
    proof: baseTemplate.baseWeights.proof + adjustments.proof,
  };

  // Clamp weights to reasonable bounds [0.05, 0.60]
  weights = {
    source: Math.max(0.05, Math.min(0.60, weights.source)),
    time: Math.max(0.05, Math.min(0.60, weights.time)),
    accuracy: Math.max(0.05, Math.min(0.60, weights.accuracy)),
    proof: Math.max(0.05, Math.min(0.60, weights.proof)),
  };

  // Normalize to sum to 1.0
  const sum = weights.source + weights.time + weights.accuracy + weights.proof;
  weights = {
    source: Math.round((weights.source / sum) * 100) / 100,
    time: Math.round((weights.time / sum) * 100) / 100,
    accuracy: Math.round((weights.accuracy / sum) * 100) / 100,
    proof: Math.round((weights.proof / sum) * 100) / 100,
  };

  // Ensure sum is exactly 1.0 (fix rounding errors)
  const finalSum = weights.source + weights.time + weights.accuracy + weights.proof;
  if (finalSum !== 1.0) {
    weights.source += 1.0 - finalSum;
    weights.source = Math.round(weights.source * 100) / 100;
  }

  // Generate unique ID
  const id = `custom_${template}_${Date.now().toString(36)}`;

  // Generate name and description
  const name = `Custom ${template.charAt(0).toUpperCase() + template.slice(1)} Formula`;
  const description = `AI-generated formula for: ${reason.slice(0, 100)}`;

  // Determine min acceptable score
  let minAcceptableScore = baseTemplate.minScore;
  if (reason.toLowerCase().includes('strict') || reason.toLowerCase().includes('high standard')) {
    minAcceptableScore += 10;
  }
  if (reason.toLowerCase().includes('lenient') || reason.toLowerCase().includes('flexible')) {
    minAcceptableScore -= 10;
  }
  minAcceptableScore = Math.max(50, Math.min(95, minAcceptableScore));

  // Generate reasoning
  const reasoning = generateFormulaReasoning(
    template,
    baseTemplate,
    weights,
    analysisNotes,
    reason
  );

  return {
    id,
    name,
    description,
    weights,
    minAcceptableScore,
    reasoning,
    applicableDataTypes: [context.dataType],
  };
}

/**
 * Generate human-readable reasoning for the formula.
 */
function generateFormulaReasoning(
  template: string,
  baseTemplate: typeof FORMULA_TEMPLATES[string],
  finalWeights: { source: number; time: number; accuracy: number; proof: number },
  analysisNotes: string[],
  userReason: string
): string {
  const parts: string[] = [];

  parts.push(`Custom Formula Generation Report`);
  parts.push(`================================`);
  parts.push(``);
  parts.push(`User Request: "${userReason}"`);
  parts.push(``);
  parts.push(`Base Template Selected: ${template}`);
  parts.push(`Template Characteristics: ${baseTemplate.traits.join(', ')}`);
  parts.push(``);
  parts.push(`Analysis Notes:`);
  analysisNotes.forEach(note => parts.push(`  - ${note}`));
  parts.push(``);
  parts.push(`Final Weights:`);
  parts.push(`  - Source (S):   ${(finalWeights.source * 100).toFixed(0)}%`);
  parts.push(`  - Time (T):     ${(finalWeights.time * 100).toFixed(0)}%`);
  parts.push(`  - Accuracy (A): ${(finalWeights.accuracy * 100).toFixed(0)}%`);
  parts.push(`  - Proof (P):    ${(finalWeights.proof * 100).toFixed(0)}%`);
  parts.push(``);

  // Explain weight rationale
  const dominant = Object.entries(finalWeights).sort((a, b) => b[1] - a[1])[0];
  parts.push(`Weight Rationale:`);
  parts.push(`  The formula emphasizes ${dominant[0]} (${(dominant[1] * 100).toFixed(0)}%) based on the context.`);

  if (finalWeights.proof > 0.35) {
    parts.push(`  High proof weight indicates cryptographic verification is critical for this use case.`);
  }
  if (finalWeights.time > 0.30) {
    parts.push(`  Elevated time weight reflects time-sensitive nature of this data.`);
  }
  if (finalWeights.source > 0.35) {
    parts.push(`  Strong source weight due to need for trusted data origin.`);
  }
  if (finalWeights.accuracy > 0.30) {
    parts.push(`  Accuracy is prioritized for cross-validation with reference data.`);
  }

  return parts.join('\n');
}

// ============================================
// Export for Direct Use
// ============================================

export { FORMULA_TEMPLATES };
