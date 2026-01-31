/**
 * OracleLens Shared Types
 * Types used across frontend and API
 */

// ============================================
// API Request/Response Types
// ============================================

export interface EvaluateRequest {
  oracleName: string;
  dataType: string;
  dataValue: Record<string, unknown>;
  sourceUrl?: string;
  referenceValues?: number[];
}

export interface EvaluateResponse {
  success: boolean;
  requestId: string;

  // Scoring results
  score: number;
  trustLevel: 'high' | 'medium' | 'low' | 'untrusted';

  // Score breakdown
  breakdown: {
    source: { raw: number; weighted: number };
    time: { raw: number; weighted: number };
    accuracy: { raw: number; weighted: number };
    proof: { raw: number; weighted: number };
  };

  // Formula info
  formulaId: string;
  formulaName: string;

  // Explanations
  explanation: string;
  aiReasoning: string;

  // zkTLS info
  zkVerified: boolean;
  proofHash: string;

  // On-chain submission result
  onChain?: {
    success: boolean;
    txHash?: string;
    blockNumber?: number;
    mode: 'real' | 'skipped';
    error?: string;
  };

  // Timestamps
  timestamp: number;

  // Error (if any)
  error?: string;
}

// ============================================
// Mock Oracle Data Examples
// ============================================

export const MOCK_ORACLE_DATA = {
  chainlink_eth_usd: {
    oracleName: 'Chainlink',
    dataType: 'price_feed',
    dataValue: {
      asset: 'ETH/USD',
      price: 2534.89,
      timestamp: Date.now() - 30000, // 30 seconds ago
    },
    sourceUrl: 'https://data.chain.link/ethereum/mainnet/crypto-usd/eth-usd',
    referenceValues: [2532.50, 2535.20, 2534.10],
  },

  pyth_btc_usd: {
    oracleName: 'Pyth',
    dataType: 'price_feed',
    dataValue: {
      asset: 'BTC/USD',
      price: 43250.00,
      timestamp: Date.now() - 15000,
    },
    sourceUrl: 'https://pyth.network/price-feeds/crypto-btc-usd',
    referenceValues: [43245.00, 43260.00, 43255.00],
  },

  weather_nyc: {
    oracleName: 'WeatherAPI',
    dataType: 'weather',
    dataValue: {
      location: 'New York, NY',
      temperature: 42,
      unit: 'fahrenheit',
      condition: 'cloudy',
    },
    sourceUrl: 'https://api.weatherapi.com/v1/current.json',
    referenceValues: [41, 43, 42],
  },

  suspicious_unknown: {
    oracleName: 'UnknownOracle',
    dataType: 'price_feed',
    dataValue: {
      asset: 'ETH/USD',
      price: 2700.00, // Suspiciously different
      timestamp: Date.now() - 600000, // 10 minutes ago (stale)
    },
    sourceUrl: 'https://suspicious-oracle.example.com/price',
    referenceValues: [2534.89, 2535.20, 2534.10],
  },
} as const;

export type MockDataKey = keyof typeof MOCK_ORACLE_DATA;
