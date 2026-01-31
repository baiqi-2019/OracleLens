/**
 * @oraclelens/zk
 *
 * zkTLS verification module using Primus Labs SDK.
 * Provides cryptographic proof of data source authenticity.
 *
 * Environment Variables:
 * - PRIMUS_APP_ID: Application ID from Primus Developer Hub
 * - PRIMUS_APP_SECRET: Application secret (keep secure!)
 * - PRIMUS_TEMPLATE_ID: Default template ID for attestations
 * - PRIMUS_MODE: 'production' | 'test' | 'mock' (default: 'mock')
 */

// Types
export {
  PrimusConfig,
  PrimusInitOptions,
  AttestationCondition,
  AttestationMode,
  AttestationRequest,
  AttestationResult,
  AttestorInfo,
  ResponseResolveItem,
  ZkVerificationResult,
  MockAttestationData,
  IZkTlsClient,
} from './types';

// Client
export {
  PrimusZkTlsClient,
  MockZkTlsClient,
  createZkTlsClient,
  generateProofHash,
} from './primusClient';

// Verification
export {
  verifyOracleDataSource,
  verifyMultipleDataSources,
  extractVerifiedData,
  isTrustedAttestor,
  getAttestationAge,
  isAttestationFresh,
  verifyProofHash,
  createProofSummary,
  VERIFICATION_TEMPLATES,
  type OracleDataForVerification,
  type VerificationOptions,
  type OracleLensVerificationResult,
} from './verifyTlsData';
