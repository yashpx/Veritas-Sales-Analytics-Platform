-- Add insights column (JSONB type) to call_logs table
ALTER TABLE call_logs 
ADD COLUMN IF NOT EXISTS insights JSONB DEFAULT NULL;

-- Add processed_at column (TIMESTAMP type) to call_logs table
ALTER TABLE call_logs 
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
