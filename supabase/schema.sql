-- OracleLens Database Schema
-- A credibility verification layer for oracle-fed data

-- ============================================
-- Table: oracle_requests
-- Stores incoming oracle data submissions for evaluation
-- ============================================
CREATE TABLE oracle_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Oracle identification
    oracle_name VARCHAR(100) NOT NULL,           -- e.g., "Chainlink", "Pyth", "API3"
    data_type VARCHAR(50) NOT NULL,              -- e.g., "price_feed", "weather", "sports"

    -- The data being evaluated
    data_value JSONB NOT NULL,                   -- Flexible structure for various data types
    -- Example: {"asset": "ETH/USD", "price": 2450.50, "timestamp": 1706700000}

    -- Source metadata
    source_url TEXT,                             -- Original data source URL (for zkTLS)
    reported_timestamp TIMESTAMPTZ,              -- When the oracle claims data was fetched

    -- Request metadata
    requester_address VARCHAR(42),               -- Ethereum address of requester (optional)
    status VARCHAR(20) DEFAULT 'pending',        -- pending, processing, completed, failed

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: zk_proofs
-- Stores zkTLS proofs verifying data source authenticity
-- ============================================
CREATE TABLE zk_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES oracle_requests(id) ON DELETE CASCADE,

    -- Proof data from Primus Labs zkTLS
    proof_data JSONB NOT NULL,                   -- The actual zkTLS proof
    -- Example: {"attestation": "...", "signature": "...", "publicKey": "..."}

    -- Verification results
    verified BOOLEAN DEFAULT FALSE,              -- Whether proof passed verification
    verification_timestamp TIMESTAMPTZ,

    -- Source verification details
    verified_domain TEXT,                        -- Domain verified by zkTLS
    verified_endpoint TEXT,                      -- API endpoint verified

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: credibility_results
-- Stores the final credibility evaluation results
-- ============================================
CREATE TABLE credibility_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES oracle_requests(id) ON DELETE CASCADE,

    -- Credibility score (0-100)
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),

    -- Score breakdown by factor
    score_breakdown JSONB NOT NULL,
    -- Example: {
    --   "source_reliability": 85,
    --   "data_consistency": 90,
    --   "time_freshness": 75,
    --   "zk_verification": 100
    -- }

    -- Formula used for scoring
    formula_id VARCHAR(50) NOT NULL,             -- e.g., "price_feed_v1", "generic_v1"
    formula_weights JSONB NOT NULL,              -- Weights used in calculation
    -- Example: {"source": 0.3, "consistency": 0.3, "freshness": 0.2, "zk": 0.2}

    -- Human-readable explanation
    explanation TEXT NOT NULL,                   -- Why this score was given

    -- AI reasoning (if AI was used for formula selection)
    ai_reasoning TEXT,                           -- AI's explanation for formula choice

    -- On-chain reference (after storing result on blockchain)
    tx_hash VARCHAR(66),                         -- Transaction hash on Sepolia
    contract_address VARCHAR(42),                -- Contract where result was stored

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for common queries
-- ============================================
CREATE INDEX idx_oracle_requests_status ON oracle_requests(status);
CREATE INDEX idx_oracle_requests_oracle_name ON oracle_requests(oracle_name);
CREATE INDEX idx_oracle_requests_created_at ON oracle_requests(created_at DESC);

CREATE INDEX idx_zk_proofs_request_id ON zk_proofs(request_id);
CREATE INDEX idx_zk_proofs_verified ON zk_proofs(verified);

CREATE INDEX idx_credibility_results_request_id ON credibility_results(request_id);
CREATE INDEX idx_credibility_results_score ON credibility_results(score);

-- ============================================
-- Updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_oracle_requests_updated_at
    BEFORE UPDATE ON oracle_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
