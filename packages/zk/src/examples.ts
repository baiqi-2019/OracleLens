/**
 * OracleLens zkTLS Module - Example Tests
 *
 * Run with: npx ts-node examples.ts
 *
 * Demonstrates zkTLS verification flow using mock client.
 */

import {
  createZkTlsClient,
  verifyOracleDataSource,
  extractVerifiedData,
  isTrustedAttestor,
  isAttestationFresh,
  verifyProofHash,
  createProofSummary,
  generateProofHash,
  VERIFICATION_TEMPLATES,
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
// Test: Client Initialization
// ============================================

async function testClientInit() {
  console.log('\n=== Client Initialization Tests ===\n');

  // Test mock client (default when no credentials)
  const mockClient = createZkTlsClient();
  const initialized = await mockClient.init();

  assert(initialized, 'Mock client should initialize successfully');
  assert(mockClient.isInitialized(), 'Client should report initialized');

  console.log('Mock client initialized successfully');
}

// ============================================
// Test: Full Verification Flow
// ============================================

async function testFullVerification() {
  console.log('\n=== Full Verification Flow Tests ===\n');

  const client = createZkTlsClient();
  await client.init();

  const userAddress = '0x' + '1'.repeat(40);

  // Execute full verification
  const result = await client.fullVerification(userAddress);

  assert(result.success, 'Verification should succeed');
  assert(result.verified, 'Attestation should be verified');
  assert(result.proofHash.length > 0, 'Should have proof hash');
  assert(result.proofHash.startsWith('0x'), 'Proof hash should start with 0x');
  assert(result.attestation !== undefined, 'Should have attestation data');
  assert(result.verifiedDomain !== undefined, 'Should have verified domain');

  console.log('\nVerification Result:');
  console.log(`  Success: ${result.success}`);
  console.log(`  Verified: ${result.verified}`);
  console.log(`  Proof Hash: ${result.proofHash.substring(0, 20)}...`);
  console.log(`  Domain: ${result.verifiedDomain}`);
  console.log(`  Endpoint: ${result.verifiedEndpoint}`);
  console.log(`  Timestamp: ${new Date(result.timestamp).toISOString()}`);
}

// ============================================
// Test: Oracle Data Source Verification
// ============================================

async function testOracleDataVerification() {
  console.log('\n=== Oracle Data Source Verification Tests ===\n');

  const result = await verifyOracleDataSource({
    sourceUrl: 'https://api.coingecko.com/api/v3/simple/price',
    oracleName: 'Chainlink',
    dataType: 'price_feed',
    dataValue: { asset: 'ETH/USD', price: 2500.42 },
  });

  assert(result.success, 'Oracle verification should succeed');
  assert(result.oracleName === 'Chainlink', 'Should preserve oracle name');
  assert(result.dataType === 'price_feed', 'Should preserve data type');
  assert(result.originalData.asset === 'ETH/USD', 'Should preserve original data');

  console.log('\nOracle Verification Result:');
  console.log(`  Oracle: ${result.oracleName}`);
  console.log(`  Data Type: ${result.dataType}`);
  console.log(`  Verified: ${result.verified}`);
  console.log(`  Proof Hash: ${result.proofHash.substring(0, 20)}...`);
}

// ============================================
// Test: Attestation Utilities
// ============================================

async function testAttestationUtilities() {
  console.log('\n=== Attestation Utility Tests ===\n');

  const client = createZkTlsClient();
  await client.init();

  const userAddress = '0x' + '2'.repeat(40);
  const result = await client.fullVerification(userAddress);
  const attestation = result.attestation!;

  // Test extract verified data
  const verifiedData = extractVerifiedData(attestation);
  assert(verifiedData !== null, 'Should extract verified data');
  console.log('Extracted Data:', verifiedData);

  // Test trusted attestor check
  const isTrusted = isTrustedAttestor(attestation);
  assert(isTrusted, 'Mock attestor should be trusted (primuslabs.org)');
  console.log(`Is Trusted Attestor: ${isTrusted}`);

  // Test attestation freshness
  const isFresh = isAttestationFresh(attestation, 300);
  assert(isFresh, 'New attestation should be fresh');
  console.log(`Is Fresh (< 5min): ${isFresh}`);

  // Test proof hash verification
  const expectedHash = generateProofHash(attestation);
  const hashMatches = verifyProofHash(attestation, expectedHash);
  assert(hashMatches, 'Proof hash should match');
  console.log(`Proof Hash Matches: ${hashMatches}`);

  // Test proof summary
  const summary = createProofSummary(result);
  assert(summary.proofHash === result.proofHash, 'Summary should have correct hash');
  assert(summary.verified === result.verified, 'Summary should have correct verified status');
  console.log('\nProof Summary:', summary);
}

// ============================================
// Test: Step-by-step Verification
// ============================================

async function testStepByStepVerification() {
  console.log('\n=== Step-by-step Verification Tests ===\n');

  const client = createZkTlsClient();
  await client.init();

  const userAddress = '0x' + '3'.repeat(40);

  // Step 1: Create attestation request
  console.log('Step 1: Creating attestation request...');
  const signedRequest = await client.createAttestationRequest(userAddress);
  assert(signedRequest.length > 0, 'Should create signed request');
  console.log(`  Request created (${signedRequest.length} chars)`);

  // Step 2: Execute attestation
  console.log('Step 2: Executing attestation...');
  const attestation = await client.executeAttestation(signedRequest);
  assert(attestation.recipient === userAddress, 'Attestation should have correct recipient');
  assert(attestation.signatures.length > 0, 'Attestation should have signatures');
  console.log(`  Attestation received from ${attestation.attestors.length} attestor(s)`);

  // Step 3: Verify attestation
  console.log('Step 3: Verifying attestation...');
  const isValid = await client.verifyAttestation(attestation);
  assert(isValid, 'Attestation should be valid');
  console.log(`  Verification result: ${isValid ? 'VALID' : 'INVALID'}`);

  // Generate proof hash
  const proofHash = generateProofHash(attestation);
  console.log(`  Proof Hash: ${proofHash}`);
}

// ============================================
// Test: Verification Templates Info
// ============================================

function testVerificationTemplates() {
  console.log('\n=== Verification Templates ===\n');

  for (const [name, template] of Object.entries(VERIFICATION_TEMPLATES)) {
    console.log(`${name}:`);
    console.log(`  Description: ${template.description}`);
    console.log(`  Supported: ${template.supportedSources.join(', ')}`);
  }
}

// ============================================
// Test: Environment Variable Handling
// ============================================

function testEnvVarHandling() {
  console.log('\n=== Environment Variable Handling ===\n');

  // Without env vars, should default to mock
  const client = createZkTlsClient();
  assert(client !== null, 'Should create client without env vars');
  console.log('Client created without credentials (uses mock mode)');

  // Check what env vars would be needed
  console.log('\nRequired Environment Variables for Production:');
  console.log('  PRIMUS_APP_ID     - Application ID from Primus Developer Hub');
  console.log('  PRIMUS_APP_SECRET - Application secret (keep secure!)');
  console.log('  PRIMUS_TEMPLATE_ID - Default template ID for attestations');
  console.log('  PRIMUS_MODE       - "production" | "test" | "mock"');
}

// ============================================
// Run All Tests
// ============================================

async function runAllTests() {
  try {
    await testClientInit();
    await testFullVerification();
    await testOracleDataVerification();
    await testAttestationUtilities();
    await testStepByStepVerification();
    testVerificationTemplates();
    testEnvVarHandling();

    console.log('\n========================================');
    console.log('All zkTLS module tests passed! ✅');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

runAllTests();
