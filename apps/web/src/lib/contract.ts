/**
 * OracleLens Contract Integration
 *
 * Interacts with the OracleLensRegistry smart contract for on-chain result storage.
 * Falls back gracefully when no contract is deployed or no private key is configured.
 *
 * Environment Variables:
 * - CONTRACT_ADDRESS: Deployed OracleLensRegistry address
 * - CONTRACT_RPC_URL: Ethereum RPC endpoint
 * - CONTRACT_PRIVATE_KEY: Private key for submitting results on-chain
 */

import { ethers } from 'ethers';

// ABI for OracleLensRegistry (minimal - only the functions we need)
const REGISTRY_ABI = [
  'function submitResult(bytes32 requestId, uint8 score, bool zkVerified, bytes32 proofHash) external',
  'function getResult(bytes32 requestId) external view returns (tuple(uint8 score, bool zkVerified, bytes32 proofHash, uint64 timestamp, address submitter))',
  'function isTrusted(bytes32 requestId) external view returns (bool)',
  'function exists(bytes32 requestId) external view returns (bool)',
  'function trustThreshold() external view returns (uint8)',
  'function owner() external view returns (address)',
  'event ResultSubmitted(bytes32 indexed requestId, uint8 score, bool zkVerified, bytes32 proofHash, address indexed submitter)',
];

// ============================================
// Types
// ============================================

interface OnChainSubmitResult {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  error?: string;
  mode: 'real' | 'skipped';
}

interface OnChainQueryResult {
  exists: boolean;
  score?: number;
  zkVerified?: boolean;
  proofHash?: string;
  timestamp?: number;
  submitter?: string;
  isTrusted?: boolean;
}

// ============================================
// Contract Client
// ============================================

function getContractConfig() {
  const address = process.env.CONTRACT_ADDRESS;
  const rpcUrl = process.env.CONTRACT_RPC_URL;
  const privateKey = process.env.CONTRACT_PRIVATE_KEY;

  return { address, rpcUrl, privateKey };
}

function getProvider(): ethers.JsonRpcProvider | null {
  const { rpcUrl } = getContractConfig();
  if (!rpcUrl) return null;
  return new ethers.JsonRpcProvider(rpcUrl);
}

function getContract(signerOrProvider: ethers.Signer | ethers.Provider): ethers.Contract | null {
  const { address } = getContractConfig();
  if (!address) return null;
  return new ethers.Contract(address, REGISTRY_ABI, signerOrProvider);
}

// ============================================
// Submit Result On-Chain
// ============================================

/**
 * Submit evaluation result to the on-chain registry.
 * Skips gracefully if contract is not configured.
 */
export async function submitResultOnChain(
  requestId: string,
  score: number,
  zkVerified: boolean,
  proofHash: string
): Promise<OnChainSubmitResult> {
  const { address, rpcUrl, privateKey } = getContractConfig();

  if (!address || !rpcUrl || !privateKey) {
    console.log('[Contract] Skipping on-chain submission (not configured)');
    return { success: true, mode: 'skipped' };
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(address, REGISTRY_ABI, wallet);

    // Convert requestId string to bytes32
    const requestIdBytes = ethers.id(requestId);

    // Convert proofHash string to bytes32
    const proofHashBytes = proofHash.startsWith('0x') && proofHash.length === 66
      ? proofHash
      : ethers.id(proofHash);

    console.log(`[Contract] Submitting result on-chain: ${requestId} score=${score}`);

    const tx = await contract.submitResult(
      requestIdBytes,
      score,
      zkVerified,
      proofHashBytes
    );

    const receipt = await tx.wait();

    console.log(`[Contract] Result submitted: tx=${receipt.hash} block=${receipt.blockNumber}`);

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      mode: 'real',
    };
  } catch (error) {
    console.error('[Contract] On-chain submission failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      mode: 'real',
    };
  }
}

// ============================================
// Query On-Chain Results
// ============================================

/**
 * Query an evaluation result from the on-chain registry.
 */
export async function queryResultOnChain(requestId: string): Promise<OnChainQueryResult> {
  const provider = getProvider();
  if (!provider) {
    return { exists: false };
  }

  const contract = getContract(provider);
  if (!contract) {
    return { exists: false };
  }

  try {
    const requestIdBytes = ethers.id(requestId);
    const exists = await contract.exists(requestIdBytes);

    if (!exists) {
      return { exists: false };
    }

    const result = await contract.getResult(requestIdBytes);
    const isTrusted = await contract.isTrusted(requestIdBytes);

    return {
      exists: true,
      score: Number(result.score),
      zkVerified: result.zkVerified,
      proofHash: result.proofHash,
      timestamp: Number(result.timestamp),
      submitter: result.submitter,
      isTrusted,
    };
  } catch (error) {
    console.error('[Contract] Query failed:', error);
    return { exists: false };
  }
}

/**
 * Get contract status info.
 */
export async function getContractStatus(): Promise<{
  configured: boolean;
  address?: string;
  rpcUrl?: string;
  trustThreshold?: number;
  owner?: string;
}> {
  const { address, rpcUrl } = getContractConfig();

  if (!address || !rpcUrl) {
    return { configured: false };
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(address, REGISTRY_ABI, provider);
    const trustThreshold = await contract.trustThreshold();
    const owner = await contract.owner();

    return {
      configured: true,
      address,
      rpcUrl,
      trustThreshold: Number(trustThreshold),
      owner,
    };
  } catch (error) {
    return {
      configured: true,
      address,
      rpcUrl,
    };
  }
}
