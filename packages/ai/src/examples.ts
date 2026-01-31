/**
 * OracleLens AI Module - Example Tests
 *
 * Run with: npx ts-node examples.ts
 *
 * Demonstrates AI formula selection and custom formula generation.
 */

import {
  selectFormulaWithAI,
  generateCustomFormula,
  applyWeightAdjustments,
  OracleDataContext,
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

// ============================================
// Test: Formula Selection
// ============================================

async function testFormulaSelection() {
  console.log('\n=== Formula Selection Tests ===\n');

  const now = Math.floor(Date.now() / 1000);

  // Test 1: Price feed data should select price_feed_v1
  const priceContext: OracleDataContext = {
    dataType: 'price_feed',
    oracleName: 'Chainlink',
    dataValue: { asset: 'ETH/USD', price: 2500 },
    currentTimestamp: now,
    hasZkProof: true,
    proofVerified: true,
    referenceDataAvailable: true,
  };

  const priceResult = await selectFormulaWithAI(priceContext);
  assert(priceResult.formulaId === 'price_feed_v1', 'Price feed should select price_feed_v1');
  assert(priceResult.confidence === 'high', 'Known oracle with proof should have high confidence');
  assert(priceResult.reasoning.length > 50, 'Reasoning should be substantial');

  console.log('\nPrice Feed Selection:');
  console.log(`  Formula: ${priceResult.formulaId}`);
  console.log(`  Confidence: ${priceResult.confidence}`);
  console.log(`  Reasoning:\n${priceResult.reasoning.split('\n').map(l => '    ' + l).join('\n')}`);

  // Test 2: Weather data should select weather_v1
  const weatherContext: OracleDataContext = {
    dataType: 'temperature',
    oracleName: 'WeatherAPI',
    dataValue: { location: 'NYC', temp: 72 },
    currentTimestamp: now,
    hasZkProof: false,
    referenceDataAvailable: true,
  };

  const weatherResult = await selectFormulaWithAI(weatherContext);
  assert(weatherResult.formulaId === 'weather_v1', 'Temperature should select weather_v1');

  console.log('\nWeather Selection:');
  console.log(`  Formula: ${weatherResult.formulaId}`);
  console.log(`  Confidence: ${weatherResult.confidence}`);

  // Test 3: Governance data should select policy_v1
  const govContext: OracleDataContext = {
    dataType: 'governance_vote',
    oracleName: 'GovernanceOracle',
    dataValue: { proposal: 'PIP-42', result: 'passed' },
    currentTimestamp: now,
    hasZkProof: true,
    proofVerified: true,
    referenceDataAvailable: false,
  };

  const govResult = await selectFormulaWithAI(govContext);
  assert(govResult.formulaId === 'policy_v1', 'Governance should select policy_v1');

  console.log('\nGovernance Selection:');
  console.log(`  Formula: ${govResult.formulaId}`);
  console.log(`  Confidence: ${govResult.confidence}`);

  // Test 4: Unknown data type should select generic_v1
  const unknownContext: OracleDataContext = {
    dataType: 'random_stuff',
    oracleName: 'RandomOracle',
    dataValue: { foo: 'bar' },
    currentTimestamp: now,
    hasZkProof: false,
    referenceDataAvailable: false,
  };

  const unknownResult = await selectFormulaWithAI(unknownContext);
  assert(unknownResult.formulaId === 'generic_v1', 'Unknown type should select generic_v1');
  assert(unknownResult.confidence === 'low', 'Unknown oracle without proof should have low confidence');

  console.log('\nUnknown Type Selection:');
  console.log(`  Formula: ${unknownResult.formulaId}`);
  console.log(`  Confidence: ${unknownResult.confidence}`);

  // Test 5: Sports outcome should select prediction_v1
  const sportsContext: OracleDataContext = {
    dataType: 'sports_result',
    oracleName: 'SportsOracle',
    dataValue: { match: 'TeamA vs TeamB', winner: 'TeamA' },
    currentTimestamp: now,
    hasZkProof: true,
    proofVerified: true,
    referenceDataAvailable: true,
  };

  const sportsResult = await selectFormulaWithAI(sportsContext);
  assert(sportsResult.formulaId === 'prediction_v1', 'Sports should select prediction_v1');

  console.log('\nSports Selection:');
  console.log(`  Formula: ${sportsResult.formulaId}`);
  console.log(`  Confidence: ${sportsResult.confidence}`);
}

// ============================================
// Test: Weight Adjustments
// ============================================

async function testWeightAdjustments() {
  console.log('\n=== Weight Adjustment Tests ===\n');

  const now = Math.floor(Date.now() / 1000);

  // Context with verified proof should suggest proof weight increase
  const contextWithProof: OracleDataContext = {
    dataType: 'price_feed',
    oracleName: 'UnknownOracle', // Unknown oracle
    dataValue: { price: 100 },
    currentTimestamp: now,
    hasZkProof: true,
    proofVerified: true,
    referenceDataAvailable: false, // No reference data
  };

  const result = await selectFormulaWithAI(contextWithProof);

  assert(
    result.weightAdjustments !== undefined,
    'Should have weight adjustments for context with special conditions'
  );

  if (result.weightAdjustments) {
    console.log('Weight Adjustments:');
    console.log(`  Source: ${result.weightAdjustments.source ?? 'no change'}`);
    console.log(`  Time: ${result.weightAdjustments.time ?? 'no change'}`);
    console.log(`  Accuracy: ${result.weightAdjustments.accuracy ?? 'no change'}`);
    console.log(`  Proof: ${result.weightAdjustments.proof ?? 'no change'}`);
    console.log(`  Reasoning: ${result.adjustmentReasoning}`);
  }

  // Test applying adjustments
  const baseWeights = { source: 0.25, time: 0.25, accuracy: 0.25, proof: 0.25 };
  const adjusted = applyWeightAdjustments(baseWeights, result.weightAdjustments);

  const sum = adjusted.source + adjusted.time + adjusted.accuracy + adjusted.proof;
  assert(
    Math.abs(sum - 1.0) < 0.01,
    `Adjusted weights should sum to 1.0 (got ${sum})`
  );

  console.log('\nApplied Adjustments:');
  console.log(`  Source: ${baseWeights.source} → ${adjusted.source.toFixed(3)}`);
  console.log(`  Time: ${baseWeights.time} → ${adjusted.time.toFixed(3)}`);
  console.log(`  Accuracy: ${baseWeights.accuracy} → ${adjusted.accuracy.toFixed(3)}`);
  console.log(`  Proof: ${baseWeights.proof} → ${adjusted.proof.toFixed(3)}`);
}

// ============================================
// Test: Custom Formula Generation
// ============================================

async function testCustomFormulaGeneration() {
  console.log('\n=== Custom Formula Generation Tests ===\n');

  const now = Math.floor(Date.now() / 1000);

  // Test 1: Generate formula for time-critical financial data
  const financialContext: OracleDataContext = {
    dataType: 'high_frequency_trading',
    oracleName: 'HFTOracle',
    dataValue: { price: 100, volume: 1000000 },
    currentTimestamp: now,
    hasZkProof: true,
    proofVerified: true,
    referenceDataAvailable: true,
  };

  const financialFormula = await generateCustomFormula(
    financialContext,
    'Real-time trading data that is extremely time-critical, needs financial-grade accuracy'
  );

  assert(financialFormula.id.startsWith('custom_'), 'Should have custom ID');
  assert(financialFormula.weights.time > 0.25, 'Time-critical should have elevated time weight');

  const fSum = financialFormula.weights.source + financialFormula.weights.time +
               financialFormula.weights.accuracy + financialFormula.weights.proof;
  assert(Math.abs(fSum - 1.0) < 0.01, `Weights should sum to 1.0 (got ${fSum})`);

  console.log('Financial Formula Generated:');
  console.log(`  ID: ${financialFormula.id}`);
  console.log(`  Name: ${financialFormula.name}`);
  console.log(`  Weights: S=${financialFormula.weights.source} T=${financialFormula.weights.time} A=${financialFormula.weights.accuracy} P=${financialFormula.weights.proof}`);
  console.log(`  Min Score: ${financialFormula.minAcceptableScore}`);
  console.log(`\nReasoning:\n${financialFormula.reasoning.split('\n').map(l => '  ' + l).join('\n')}`);

  // Test 2: Generate formula for sensitive KYC data
  const kycContext: OracleDataContext = {
    dataType: 'kyc_verification',
    oracleName: 'KYCProvider',
    dataValue: { verified: true },
    currentTimestamp: now,
    hasZkProof: true,
    proofVerified: true,
    referenceDataAvailable: false,
  };

  const kycFormula = await generateCustomFormula(
    kycContext,
    'Sensitive KYC data with strict privacy requirements'
  );

  assert(kycFormula.weights.proof > 0.4, 'Sensitive data should have high proof weight');
  assert(kycFormula.minAcceptableScore >= 80, 'Sensitive data should have high min score');

  console.log('\nKYC Formula Generated:');
  console.log(`  ID: ${kycFormula.id}`);
  console.log(`  Weights: S=${kycFormula.weights.source} T=${kycFormula.weights.time} A=${kycFormula.weights.accuracy} P=${kycFormula.weights.proof}`);
  console.log(`  Min Score: ${kycFormula.minAcceptableScore}`);

  // Test 3: Generate lenient formula
  const lenientContext: OracleDataContext = {
    dataType: 'social_metric',
    oracleName: 'SocialOracle',
    dataValue: { followers: 1000 },
    currentTimestamp: now,
    hasZkProof: false,
    referenceDataAvailable: true,
  };

  const lenientFormula = await generateCustomFormula(
    lenientContext,
    'Social media metrics, lenient standards acceptable'
  );

  assert(lenientFormula.minAcceptableScore < 65, 'Lenient should have lower min score');

  console.log('\nLenient Formula Generated:');
  console.log(`  ID: ${lenientFormula.id}`);
  console.log(`  Min Score: ${lenientFormula.minAcceptableScore}`);
}

// ============================================
// Test: Reasoning Quality
// ============================================

async function testReasoningQuality() {
  console.log('\n=== Reasoning Quality Tests ===\n');

  const now = Math.floor(Date.now() / 1000);

  const context: OracleDataContext = {
    dataType: 'price_feed',
    oracleName: 'Chainlink',
    dataValue: { asset: 'BTC/USD', price: 45000 },
    currentTimestamp: now,
    hasZkProof: true,
    proofVerified: true,
    referenceDataAvailable: true,
  };

  const result = await selectFormulaWithAI(context);

  // Check reasoning contains key elements
  assert(result.reasoning.includes('price_feed_v1'), 'Reasoning should mention selected formula');
  assert(result.reasoning.includes('Chainlink'), 'Reasoning should mention oracle name');
  assert(result.reasoning.includes('zkTLS'), 'Reasoning should mention zkTLS status');

  console.log('Full Reasoning Output:');
  console.log('─'.repeat(50));
  console.log(result.reasoning);
  console.log('─'.repeat(50));

  // Verify reasoning is human-readable (no technical jargon without explanation)
  assert(!result.reasoning.includes('undefined'), 'Reasoning should not contain undefined');
  assert(!result.reasoning.includes('[object'), 'Reasoning should not contain raw objects');
}

// ============================================
// Run All Tests
// ============================================

async function runAllTests() {
  try {
    await testFormulaSelection();
    await testWeightAdjustments();
    await testCustomFormulaGeneration();
    await testReasoningQuality();

    console.log('\n========================================');
    console.log('All AI module tests passed! ✅');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

runAllTests();
