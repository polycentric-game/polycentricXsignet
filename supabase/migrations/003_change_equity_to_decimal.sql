-- Change equity fields from INTEGER to NUMERIC to support decimal values
-- This allows equity swaps with up to 4 decimal places (e.g., 0.001%)

-- Change founders table equity fields to NUMERIC
ALTER TABLE founders
ALTER COLUMN total_equity_available TYPE NUMERIC(10, 4) USING total_equity_available::NUMERIC(10, 4),
ALTER COLUMN equity_swapped TYPE NUMERIC(10, 4) USING equity_swapped::NUMERIC(10, 4);

-- Update default values to match NUMERIC type
ALTER TABLE founders
ALTER COLUMN total_equity_available SET DEFAULT 100.0,
ALTER COLUMN equity_swapped SET DEFAULT 0.0;

