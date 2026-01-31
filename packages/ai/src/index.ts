/**
 * @oraclelens/ai
 *
 * AI-assisted formula selection and generation for oracle credibility scoring.
 *
 * IMPORTANT: AI is a DECISION HELPER, not a black box.
 * - AI SELECTS which formula to use
 * - AI EXPLAINS its reasoning in plain English
 * - AI does NOT calculate scores (that's deterministic logic in @oraclelens/scoring)
 */

// Types
export {
  OracleDataContext,
  FormulaSelectionResult,
  GeneratedFormula,
  AIProvider,
  AIConfig,
} from './types';

// Formula selection
export {
  MockAIProvider,
  selectFormulaWithAI,
  applyWeightAdjustments,
} from './selectFormula';

// Custom formula generation
export {
  generateCustomFormula,
  FORMULA_TEMPLATES,
} from './generateFormula';
