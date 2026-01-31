/**
 * @oraclelens/scoring
 *
 * Deterministic credibility scoring for oracle data.
 * No AI inside - pure calculations based on S, T, A, P factors.
 */

// Base scoring functions (S, T, A, P)
export {
  calculateSourceScore,
  calculateTimeScore,
  calculateAccuracyScore,
  calculateProofScore,
  calculateAllBaseScores,
  type SourceInput,
  type TimeInput,
  type AccuracyInput,
  type ProofInput,
  type BaseScores,
} from './baseScores';

// Formula definitions and scoring
export {
  FORMULAS,
  selectFormula,
  getFormulaById,
  calculateCredibilityScore,
  evaluateCredibility,
  type Formula,
  type FormulaWeights,
  type ScoringResult,
} from './formulas';
