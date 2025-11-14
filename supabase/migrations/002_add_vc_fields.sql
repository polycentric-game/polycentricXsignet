-- Add VC-related fields to agreements table
ALTER TABLE agreements
ADD COLUMN IF NOT EXISTS party_a_address TEXT,
ADD COLUMN IF NOT EXISTS party_b_address TEXT,
ADD COLUMN IF NOT EXISTS equity_a_to_b NUMERIC(10, 4),
ADD COLUMN IF NOT EXISTS equity_b_to_a NUMERIC(10, 4),
ADD COLUMN IF NOT EXISTS canonical_terms_json TEXT,
ADD COLUMN IF NOT EXISTS terms_hash TEXT,
ADD COLUMN IF NOT EXISTS sig_a TEXT,
ADD COLUMN IF NOT EXISTS sig_b TEXT,
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS vc_jwt TEXT;

-- Create index on finalized_at for querying finalized agreements
CREATE INDEX IF NOT EXISTS idx_agreements_finalized_at ON agreements(finalized_at);

-- Create index on terms_hash for verification
CREATE INDEX IF NOT EXISTS idx_agreements_terms_hash ON agreements(terms_hash);

