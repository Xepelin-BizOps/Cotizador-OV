-- Add conversion fields to fx_transactions table
ALTER TABLE fx_transactions ADD COLUMN withdrawn_amount_usd DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE fx_transactions ADD COLUMN received_amount_mxn DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE fx_transactions ADD COLUMN converted_amount_usd DECIMAL(12,2) DEFAULT 0.00;
