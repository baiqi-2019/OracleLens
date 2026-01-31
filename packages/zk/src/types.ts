/**
 * OracleLens zkTLS Module - Types
 *
 * Type definitions for Primus Labs zkTLS SDK integration.
 * Based on official documentation: https://docs.primuslabs.xyz/enterprise/zk-tls-sdk/
 */

// ============================================
// Configuration Types
// ============================================

export interface PrimusConfig {
  appId: string;
  appSecret: string;
  templateId?: string;
  mode: 'production' | 'test' | 'mock';
}

export interface PrimusInitOptions {
  platform?: 'pc' | 'android' | 'ios';
}

// ============================================
// Attestation Request Types
// ============================================

export interface AttestationCondition {
  field: string;
  op: 'SHA256' | '>' | '<' | '=' | '!=' | '>=' | '<=';
  value?: string | number;
}

export interface AttestationMode {
  algorithmType: 'proxytls' | 'mpctls';
}

export interface AttestationRequest {
  templateId: string;
  userAddress: string;
  mode: AttestationMode;
  conditions?: AttestationCondition[][];
}

// ============================================
// Attestation Response Types
// Based on: https://docs.primuslabs.xyz/enterprise/attestation-structure/
// ============================================

export interface AttestorInfo {
  attestorAddr: string;
  url: string;
}

export interface ResponseResolveItem {
  keyName: string;
  parseType: string;
  parsePath: string;
}

export interface AttestationResult {
  // Recipient & Request Details
  recipient: string;
  request: {
    url: string;
    header: string;
    method: string;
    body: string;
  };

  // Data Verification
  responseResolve: ResponseResolveItem[];
  data: string; // Stringified JSON
  attConditions: string; // Stringified JSON

  // Execution Info
  timestamp: number;
  additionParams: string;

  // Attestor Info
  attestors: AttestorInfo[];

  // Validation
  signatures: string[];
}

// ============================================
// Verification Result Types
// ============================================

export interface ZkVerificationResult {
  success: boolean;
  verified: boolean;
  proofHash: string;
  attestation?: AttestationResult;
  verifiedDomain?: string;
  verifiedEndpoint?: string;
  timestamp: number;
  error?: string;
}

// ============================================
// Mock Types (for demo without real credentials)
// ============================================

export interface MockAttestationData {
  sourceUrl: string;
  dataToVerify: Record<string, unknown>;
  simulatedDelay?: number;
}

// ============================================
// Client Interface
// ============================================

export interface IZkTlsClient {
  /**
   * Initialize the zkTLS client
   */
  init(): Promise<boolean>;

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean;

  /**
   * Create and sign an attestation request
   */
  createAttestationRequest(
    userAddress: string,
    templateId?: string
  ): Promise<string>;

  /**
   * Execute attestation and get proof
   */
  executeAttestation(signedRequest: string): Promise<AttestationResult>;

  /**
   * Verify an attestation result
   */
  verifyAttestation(attestation: AttestationResult): Promise<boolean>;

  /**
   * Full verification flow: create, execute, verify
   */
  fullVerification(userAddress: string, templateId?: string): Promise<ZkVerificationResult>;
}
