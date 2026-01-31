/**
 * OracleLens zkTLS Module - Primus Client
 *
 * Wrapper around Primus Labs zkTLS JS SDK.
 * Provides both real SDK integration and mock mode for demos.
 *
 * SDK Documentation: https://docs.primuslabs.xyz/enterprise/zk-tls-sdk/
 */

import {
  PrimusConfig,
  PrimusInitOptions,
  AttestationResult,
  ZkVerificationResult,
  IZkTlsClient,
} from './types';
import { createHash } from 'crypto';

// ============================================
// Real Primus SDK Client
// ============================================

/**
 * Real implementation using @primuslabs/zktls-js-sdk
 * Requires valid APP_ID and APP_SECRET from Primus Developer Hub
 */
export class PrimusZkTlsClient implements IZkTlsClient {
  private config: PrimusConfig;
  private sdk: any = null; // PrimusZKTLS instance
  private initialized = false;

  constructor(config: PrimusConfig) {
    this.config = config;
  }

  async init(): Promise<boolean> {
    if (this.config.mode === 'mock') {
      // Mock mode doesn't need real SDK
      this.initialized = true;
      return true;
    }

    try {
      // Dynamic import to handle environments where SDK isn't available
      // @ts-ignore - SDK may not be installed
      const { PrimusZKTLS } = await import('@primuslabs/zktls-js-sdk');
      this.sdk = new PrimusZKTLS();

      const initOptions: PrimusInitOptions = {
        platform: 'pc', // Default to PC for backend usage
      };

      const result = await this.sdk.init(
        this.config.appId,
        this.config.appSecret,
        initOptions
      );

      this.initialized = !!result;
      return this.initialized;
    } catch (error) {
      console.error('Failed to initialize Primus SDK:', error);
      this.initialized = false;
      return false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async createAttestationRequest(
    userAddress: string,
    templateId?: string
  ): Promise<string> {
    if (!this.initialized || !this.sdk) {
      throw new Error('Primus SDK not initialized');
    }

    const tplId = templateId ?? this.config.templateId;
    if (!tplId) {
      throw new Error('Template ID is required');
    }

    // Generate request parameters
    const request = this.sdk.generateRequestParams(tplId, userAddress);

    // Set attestation mode (proxytls is faster, mpctls is more secure)
    request.setAttMode({ algorithmType: 'proxytls' });

    // Convert to JSON string
    const requestStr = request.toJsonString();

    // Sign the request (in production, this should be done on backend)
    const signedRequest = await this.sdk.sign(requestStr);

    return signedRequest;
  }

  async executeAttestation(signedRequest: string): Promise<AttestationResult> {
    if (!this.initialized || !this.sdk) {
      throw new Error('Primus SDK not initialized');
    }

    // Execute the attestation
    const attestation = await this.sdk.startAttestation(signedRequest);

    return attestation as AttestationResult;
  }

  async verifyAttestation(attestation: AttestationResult): Promise<boolean> {
    if (!this.initialized || !this.sdk) {
      throw new Error('Primus SDK not initialized');
    }

    // Verify the attestation signature
    const isValid = await this.sdk.verifyAttestation(attestation);

    return isValid === true;
  }

  async fullVerification(
    userAddress: string,
    templateId?: string
  ): Promise<ZkVerificationResult> {
    const timestamp = Date.now();

    try {
      // Step 1: Create and sign request
      const signedRequest = await this.createAttestationRequest(
        userAddress,
        templateId
      );

      // Step 2: Execute attestation
      const attestation = await this.executeAttestation(signedRequest);

      // Step 3: Verify attestation
      const verified = await this.verifyAttestation(attestation);

      // Generate proof hash from attestation
      const proofHash = generateProofHash(attestation);

      // Extract domain from request URL
      const verifiedDomain = extractDomain(attestation.request?.url);

      return {
        success: true,
        verified,
        proofHash,
        attestation,
        verifiedDomain,
        verifiedEndpoint: attestation.request?.url,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        verified: false,
        proofHash: '',
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// ============================================
// Mock Client for Demos
// ============================================

/**
 * Mock implementation for demos and testing.
 * Simulates zkTLS verification without real credentials.
 */
export class MockZkTlsClient implements IZkTlsClient {
  private initialized = false;
  private simulatedDelay: number;

  constructor(simulatedDelay = 1000) {
    this.simulatedDelay = simulatedDelay;
  }

  async init(): Promise<boolean> {
    await this.delay(100);
    this.initialized = true;
    return true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async createAttestationRequest(
    userAddress: string,
    templateId?: string
  ): Promise<string> {
    await this.delay(this.simulatedDelay / 4);

    const mockRequest = {
      templateId: templateId ?? 'mock_template_001',
      userAddress,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7),
    };

    return JSON.stringify(mockRequest);
  }

  async executeAttestation(signedRequest: string): Promise<AttestationResult> {
    await this.delay(this.simulatedDelay);

    const request = JSON.parse(signedRequest);

    // Generate mock attestation
    const mockAttestation: AttestationResult = {
      recipient: request.userAddress,
      request: {
        url: 'https://api.coingecko.com/api/v3/simple/price',
        header: '{"Content-Type": "application/json"}',
        method: 'GET',
        body: '',
      },
      responseResolve: [
        {
          keyName: 'price',
          parseType: 'json',
          parsePath: '$.ethereum.usd',
        },
      ],
      data: JSON.stringify({ ethereum: { usd: 2500.42 } }),
      attConditions: JSON.stringify([{ field: 'price', op: 'SHA256' }]),
      timestamp: Date.now(),
      additionParams: JSON.stringify({ sdk: 'mock', version: '1.0.0' }),
      attestors: [
        {
          attestorAddr: '0x' + 'a'.repeat(40),
          url: 'https://primuslabs.org',
        },
      ],
      signatures: [
        '0x' + createHash('sha256')
          .update(request.userAddress + Date.now())
          .digest('hex'),
      ],
    };

    return mockAttestation;
  }

  async verifyAttestation(attestation: AttestationResult): Promise<boolean> {
    await this.delay(this.simulatedDelay / 2);

    // Mock verification - check basic structure
    const hasValidStructure = Boolean(
      attestation.recipient &&
      attestation.signatures?.length > 0 &&
      attestation.attestors?.length > 0
    );

    return hasValidStructure;
  }

  async fullVerification(
    userAddress: string,
    templateId?: string
  ): Promise<ZkVerificationResult> {
    const timestamp = Date.now();

    try {
      const signedRequest = await this.createAttestationRequest(
        userAddress,
        templateId
      );
      const attestation = await this.executeAttestation(signedRequest);
      const verified = await this.verifyAttestation(attestation);
      const proofHash = generateProofHash(attestation);

      return {
        success: true,
        verified,
        proofHash,
        attestation,
        verifiedDomain: extractDomain(attestation.request?.url),
        verifiedEndpoint: attestation.request?.url,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        verified: false,
        proofHash: '',
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================
// Factory Function
// ============================================

/**
 * Create a zkTLS client based on configuration.
 * Returns mock client if mode is 'mock' or credentials are missing.
 */
export function createZkTlsClient(config?: Partial<PrimusConfig>): IZkTlsClient {
  const appId = config?.appId ?? process.env.PRIMUS_APP_ID;
  const appSecret = config?.appSecret ?? process.env.PRIMUS_APP_SECRET;
  const templateId = config?.templateId ?? process.env.PRIMUS_TEMPLATE_ID;
  const mode = config?.mode ?? (process.env.PRIMUS_MODE as PrimusConfig['mode']) ?? 'mock';

  // Use mock if no credentials or explicitly set to mock
  if (mode === 'mock' || !appId || !appSecret) {
    console.log('[zkTLS] Using mock client (no credentials or mock mode)');
    return new MockZkTlsClient();
  }

  return new PrimusZkTlsClient({
    appId,
    appSecret,
    templateId,
    mode,
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a proof hash from attestation data.
 */
export function generateProofHash(attestation: AttestationResult): string {
  const dataToHash = JSON.stringify({
    recipient: attestation.recipient,
    data: attestation.data,
    timestamp: attestation.timestamp,
    signatures: attestation.signatures,
  });

  return '0x' + createHash('sha256').update(dataToHash).digest('hex');
}

/**
 * Extract domain from URL.
 */
function extractDomain(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return undefined;
  }
}
