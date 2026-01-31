'use client';

/**
 * Frontend zkTLS Verification Hook
 *
 * Uses Primus Labs zkTLS SDK in the browser with extension support.
 * This hook handles the entire attestation flow on the client side.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// Primus SDK types
interface Attestation {
  recipient: string;
  request: {
    url?: string;
    [key: string]: unknown;
  };
  reponseResolve: Array<{
    keyName: string;
    parsePath: string;
    parseValue: string;
  }>;
  data: string;
  timestamp: number;
  additionParams: string;
  attestors: string[];
  signatures: string[];
  [key: string]: unknown;
}

interface ZkTlsResult {
  success: boolean;
  verified: boolean;
  proofHash: string;
  attestation?: Attestation;
  error?: string;
  mode: 'real' | 'extension_not_found';
}

interface UseZkTlsReturn {
  isInitialized: boolean;
  isExtensionInstalled: boolean;
  isLoading: boolean;
  error: string | null;
  startVerification: (userAddress: string) => Promise<ZkTlsResult>;
}

// Environment variables (exposed to client via NEXT_PUBLIC_)
const PRIMUS_APP_ID = process.env.NEXT_PUBLIC_PRIMUS_APP_ID || '';
const PRIMUS_APP_SECRET = process.env.NEXT_PUBLIC_PRIMUS_APP_SECRET || '';
const PRIMUS_TEMPLATE_ID = process.env.NEXT_PUBLIC_PRIMUS_TEMPLATE_ID || '';

export function useZkTls(): UseZkTlsReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sdkRef = useRef<any>(null);
  const initPromiseRef = useRef<Promise<boolean> | null>(null);

  // Initialize SDK on mount
  useEffect(() => {
    const init = async () => {
      if (initPromiseRef.current) return initPromiseRef.current;

      initPromiseRef.current = (async () => {
        try {
          // Dynamic import for client-side only
          const { PrimusZKTLS } = await import('@primuslabs/zktls-js-sdk');
          const sdk = new PrimusZKTLS();

          // Check if extension is installed
          const hasExtension = typeof window !== 'undefined' && !!(window as any).primus;
          setIsExtensionInstalled(hasExtension);

          if (!hasExtension) {
            console.log('[zkTLS Client] Primus extension not found');
            setError('请安装 Primus 浏览器扩展');
            return false;
          }

          // Initialize with app credentials
          const result = await sdk.init(PRIMUS_APP_ID, PRIMUS_APP_SECRET);
          console.log('[zkTLS Client] SDK initialized:', result);

          sdkRef.current = sdk;
          setIsInitialized(true);
          setError(null);
          return true;
        } catch (err) {
          console.error('[zkTLS Client] Init failed:', err);
          setError(err instanceof Error ? err.message : '初始化失败');
          return false;
        }
      })();

      return initPromiseRef.current;
    };

    init();
  }, []);

  const startVerification = useCallback(async (userAddress: string): Promise<ZkTlsResult> => {
    if (!sdkRef.current || !isInitialized) {
      return {
        success: false,
        verified: false,
        proofHash: '',
        mode: 'extension_not_found',
        error: 'SDK not initialized or extension not installed',
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      const sdk = sdkRef.current;

      // Step 1: Generate request params with template ID
      console.log('[zkTLS Client] Generating request for template:', PRIMUS_TEMPLATE_ID);
      const request = sdk.generateRequestParams(PRIMUS_TEMPLATE_ID, userAddress);

      // Step 2: Set zkTLS mode
      request.setAttMode({ algorithmType: 'proxytls' });

      // Step 3: Convert to JSON string
      const requestStr = request.toJsonString();
      console.log('[zkTLS Client] Request generated');

      // Step 4: Sign the request
      const signedRequestStr = await sdk.sign(requestStr);
      console.log('[zkTLS Client] Request signed');

      // Step 5: Start attestation (this will trigger browser extension popup)
      console.log('[zkTLS Client] Starting attestation...');
      const attestation: Attestation = await sdk.startAttestation(signedRequestStr);
      console.log('[zkTLS Client] Attestation received:', attestation);

      // Step 6: Verify attestation
      const verified = sdk.verifyAttestation(attestation);
      console.log('[zkTLS Client] Verification result:', verified);

      // Generate proof hash
      const proofData = JSON.stringify({
        recipient: attestation.recipient,
        data: attestation.data,
        timestamp: attestation.timestamp,
        signatures: attestation.signatures,
      });

      // Use Web Crypto API for hashing
      const encoder = new TextEncoder();
      const data = encoder.encode(proofData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const proofHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      setIsLoading(false);

      return {
        success: true,
        verified: verified === true,
        proofHash,
        attestation,
        mode: 'real',
      };
    } catch (err) {
      console.error('[zkTLS Client] Verification failed:', err);
      const errorMessage = err instanceof Error ? err.message : '验证失败';
      setError(errorMessage);
      setIsLoading(false);

      return {
        success: false,
        verified: false,
        proofHash: '',
        mode: 'real',
        error: errorMessage,
      };
    }
  }, [isInitialized]);

  return {
    isInitialized,
    isExtensionInstalled,
    isLoading,
    error,
    startVerification,
  };
}
