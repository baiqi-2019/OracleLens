/**
 * OracleLens AI Module - Types
 *
 * Defines the interface between AI decision-making and the scoring system.
 * AI is a helper that SELECTS formulas and EXPLAINS decisions.
 * AI does NOT calculate scores - that's deterministic logic in @oraclelens/scoring.
 */

// ============================================
// Input Types - What AI receives
// ============================================

/**
 * Metadata about the oracle data being evaluated.
 * AI uses this to decide which formula is most appropriate.
 */
export interface OracleDataContext {
  // Data identification
  dataType: string;              // e.g., "price_feed", "weather", "governance"
  oracleName: string;            // e.g., "Chainlink", "Pyth"

  // Data characteristics
  dataValue: unknown;            // The actual data (for AI to understand structure)
  sourceUrl?: string;            // Where data came from

  // Timing context
  reportedTimestamp?: number;    // When oracle claims data was fetched
  currentTimestamp: number;      // Current time

  // Verification context
  hasZkProof: boolean;           // Whether zkTLS proof is available
  proofVerified?: boolean;       // Whether proof passed verification

  // Optional hints
  userHint?: string;             // User can provide context
  referenceDataAvailable: boolean; // Whether we have comparison data
}

// ============================================
// Output Types - What AI returns
// ============================================

/**
 * AI's decision on which formula to use.
 */
export interface FormulaSelectionResult {
  // Selected formula
  formulaId: string;             // e.g., "price_feed_v1"

  // Confidence in selection
  confidence: 'high' | 'medium' | 'low';

  // Human-readable explanation
  reasoning: string;             // Why this formula was chosen

  // Suggested weight adjustments (optional)
  weightAdjustments?: {
    source?: number;             // Delta to apply (-0.1 to +0.1)
    time?: number;
    accuracy?: number;
    proof?: number;
  };

  // Explanation of any adjustments
  adjustmentReasoning?: string;
}

/**
 * AI-generated custom formula for edge cases.
 */
export interface GeneratedFormula {
  // Formula definition
  id: string;                    // Generated ID like "custom_v1_abc123"
  name: string;
  description: string;

  // Weights (must sum to 1.0)
  weights: {
    source: number;
    time: number;
    accuracy: number;
    proof: number;
  };

  // Thresholds
  minAcceptableScore: number;

  // AI's reasoning
  reasoning: string;             // Why these weights were chosen

  // Applicable types
  applicableDataTypes: string[];
}

// ============================================
// AI Provider Interface
// ============================================

/**
 * Abstract interface for AI providers.
 * Allows swapping between different AI backends (OpenAI, Claude, mock, etc.)
 */
export interface AIProvider {
  /**
   * Provider name for logging/debugging
   */
  name: string;

  /**
   * Select the most appropriate formula for given context.
   */
  selectFormula(context: OracleDataContext): Promise<FormulaSelectionResult>;

  /**
   * Generate a custom formula for edge cases.
   */
  generateFormula(
    context: OracleDataContext,
    reason: string
  ): Promise<GeneratedFormula>;
}

// ============================================
// Configuration
// ============================================

export interface AIConfig {
  provider: 'mock' | 'openai' | 'claude';
  apiKey?: string;
  model?: string;
  temperature?: number;
}
