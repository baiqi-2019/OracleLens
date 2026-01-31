/**
 * OracleLens Scoring - Example Tests
 *
 * Run with: npx ts-node examples.ts
 *
 * These examples demonstrate how the scoring system works
 * and verify expected outputs.
 */

import {
  calculateSourceScore,
  calculateTimeScore,
  calculateAccuracyScore,
  calculateProofScore,
  calculateAllBaseScores,
  evaluateCredibility,
  FORMULAS,
} from './index';

// ============================================
// Test Helpers
// ============================================

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

function assertRange(value: number, min: number, max: number, message: string) {
  assert(value >= min && value <= max, `${message} (got ${value}, expected ${min}-${max})`);
}

// ============================================
// Test: Source Score
// ============================================

console.log('\n=== Source Score Tests ===\n');

// Test 1: Known trusted oracle (Chainlink)
const sourceChainlink = calculateSourceScore({
  oracleName: 'Chainlink',
  hasApiDocumentation: true,
  isRegulated: true,
});
assertRange(sourceChainlink, 0.95, 1.0, 'Chainlink should have high source score');

// Test 2: Unknown oracle
const sourceUnknown = calculateSourceScore({
  oracleName: 'RandomOracle',
  hasApiDocumentation: false,
  isRegulated: false,
});
assertRange(sourceUnknown, 0.4, 0.6, 'Unknown oracle should have medium-low score');

// Test 3: Pyth with documentation
const sourcePyth = calculateSourceScore({
  oracleName: 'Pyth',
  hasApiDocumentation: true,
  isRegulated: false,
});
assertRange(sourcePyth, 0.90, 0.98, 'Pyth with docs should have high score');

// ============================================
// Test: Time Score
// ============================================

console.log('\n=== Time Score Tests ===\n');

const now = Math.floor(Date.now() / 1000);

// Test 1: Fresh data (10 seconds old)
const timeFresh = calculateTimeScore({
  reportedTimestamp: now - 10,
  currentTimestamp: now,
  maxAcceptableAgeSeconds: 300, // 5 minutes
});
assertRange(timeFresh, 0.9, 1.0, 'Fresh data (10s) should score very high');

// Test 2: Moderately stale (2 minutes old)
const timeModerate = calculateTimeScore({
  reportedTimestamp: now - 120,
  currentTimestamp: now,
  maxAcceptableAgeSeconds: 300,
});
assertRange(timeModerate, 0.4, 0.8, 'Moderate age (2min) should score medium');

// Test 3: Very stale (10 minutes old, max 5 minutes)
const timeStale = calculateTimeScore({
  reportedTimestamp: now - 600,
  currentTimestamp: now,
  maxAcceptableAgeSeconds: 300,
});
assertRange(timeStale, 0.0, 0.5, 'Stale data should score low');

// Test 4: Future timestamp (suspicious)
const timeFuture = calculateTimeScore({
  reportedTimestamp: now + 60,
  currentTimestamp: now,
  maxAcceptableAgeSeconds: 300,
});
assert(timeFuture === 0.5, 'Future timestamp should be penalized');

// ============================================
// Test: Accuracy Score
// ============================================

console.log('\n=== Accuracy Score Tests ===\n');

// Test 1: Perfect alignment
const accuracyPerfect = calculateAccuracyScore({
  primaryValue: 2500,
  referenceValues: [2500, 2500, 2500],
  tolerancePercent: 1,
});
assertRange(accuracyPerfect, 0.95, 1.0, 'Perfect alignment should score ~1.0');

// Test 2: Within tolerance (0.5% off)
const accuracyWithin = calculateAccuracyScore({
  primaryValue: 2512.5, // 0.5% higher than 2500
  referenceValues: [2500, 2500, 2500],
  tolerancePercent: 1,
});
assertRange(accuracyWithin, 0.9, 1.0, 'Within tolerance should score high');

// Test 3: Outside tolerance (5% off)
const accuracyOutside = calculateAccuracyScore({
  primaryValue: 2625, // 5% higher than 2500
  referenceValues: [2500, 2500, 2500],
  tolerancePercent: 1,
});
assertRange(accuracyOutside, 0.0, 0.3, 'Outside tolerance should score low');

// Test 4: No references
const accuracyNoRef = calculateAccuracyScore({
  primaryValue: 2500,
  referenceValues: [],
  tolerancePercent: 1,
});
assert(accuracyNoRef === 0.7, 'No references should give neutral 0.7');

// ============================================
// Test: Proof Score
// ============================================

console.log('\n=== Proof Score Tests ===\n');

// Test 1: Verified proof from trusted domain
const proofVerified = calculateProofScore({
  hasZkProof: true,
  proofVerified: true,
  proofDomain: 'api.coingecko.com',
});
assert(proofVerified === 1.0, 'Verified proof from trusted domain should be 1.0');

// Test 2: Verified proof from unknown domain
const proofUnknownDomain = calculateProofScore({
  hasZkProof: true,
  proofVerified: true,
  proofDomain: 'api.unknown.com',
});
assert(proofUnknownDomain === 0.9, 'Verified proof from unknown domain should be 0.9');

// Test 3: No proof
const proofNone = calculateProofScore({
  hasZkProof: false,
  proofVerified: false,
});
assert(proofNone === 0.4, 'No proof should be 0.4');

// Test 4: Failed verification
const proofFailed = calculateProofScore({
  hasZkProof: true,
  proofVerified: false,
});
assert(proofFailed === 0.1, 'Failed verification should be 0.1');

// ============================================
// Test: Full Evaluation
// ============================================

console.log('\n=== Full Evaluation Tests ===\n');

// Scenario: High-quality Chainlink price feed
const baseScoresGood = calculateAllBaseScores(
  { oracleName: 'Chainlink', hasApiDocumentation: true, isRegulated: true },
  { reportedTimestamp: now - 30, currentTimestamp: now, maxAcceptableAgeSeconds: 300 },
  { primaryValue: 2500, referenceValues: [2498, 2502, 2501], tolerancePercent: 1 },
  { hasZkProof: true, proofVerified: true, proofDomain: 'api.coingecko.com' }
);

const resultGood = evaluateCredibility('price_feed', baseScoresGood);

console.log('High-quality price feed result:');
console.log(`  Formula: ${resultGood.formulaId}`);
console.log(`  Score: ${resultGood.finalScore}/100`);
console.log(`  Trust Level: ${resultGood.trustLevel}`);

assertRange(resultGood.finalScore, 85, 100, 'High-quality feed should score 85+');
assert(resultGood.trustLevel === 'high', 'Should be HIGH trust level');

// Scenario: Suspicious unknown oracle
const baseScoresBad = calculateAllBaseScores(
  { oracleName: 'ShadyOracle', hasApiDocumentation: false, isRegulated: false },
  { reportedTimestamp: now - 600, currentTimestamp: now, maxAcceptableAgeSeconds: 300 },
  { primaryValue: 2700, referenceValues: [2500, 2500, 2500], tolerancePercent: 1 },
  { hasZkProof: true, proofVerified: false }
);

const resultBad = evaluateCredibility('price_feed', baseScoresBad);

console.log('\nSuspicious oracle result:');
console.log(`  Formula: ${resultBad.formulaId}`);
console.log(`  Score: ${resultBad.finalScore}/100`);
console.log(`  Trust Level: ${resultBad.trustLevel}`);

assertRange(resultBad.finalScore, 0, 40, 'Suspicious feed should score below 40');
assert(resultBad.trustLevel === 'untrusted', 'Should be UNTRUSTED');

// ============================================
// Test: Formula Selection
// ============================================

console.log('\n=== Formula Selection Tests ===\n');

const priceResult = evaluateCredibility('price_feed', baseScoresGood);
assert(priceResult.formulaId === 'price_feed_v1', 'price_feed should use price_feed_v1');

const weatherResult = evaluateCredibility('weather', baseScoresGood);
assert(weatherResult.formulaId === 'weather_v1', 'weather should use weather_v1');

const policyResult = evaluateCredibility('governance', baseScoresGood);
assert(policyResult.formulaId === 'policy_v1', 'governance should use policy_v1');

const predictionResult = evaluateCredibility('sports', baseScoresGood);
assert(predictionResult.formulaId === 'prediction_v1', 'sports should use prediction_v1');

const genericResult = evaluateCredibility('random_type', baseScoresGood);
assert(genericResult.formulaId === 'generic_v1', 'unknown type should use generic_v1');

// ============================================
// Summary
// ============================================

console.log('\n========================================');
console.log('All tests passed! ✅');
console.log('========================================\n');

// Print formula weights for reference
console.log('Formula Weights Reference:');
for (const [id, formula] of Object.entries(FORMULAS)) {
  console.log(`\n${formula.name} (${id}):`);
  console.log(`  S=${formula.weights.source} T=${formula.weights.time} A=${formula.weights.accuracy} P=${formula.weights.proof}`);
  console.log(`  Min acceptable: ${formula.minAcceptableScore}`);
}
