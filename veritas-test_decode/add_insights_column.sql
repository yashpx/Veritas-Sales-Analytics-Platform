-- Add insights column to call_logs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'call_logs' 
        AND column_name = 'insights'
    ) THEN
        ALTER TABLE public.call_logs ADD COLUMN insights JSONB;
    END IF;
END $$;

-- Add processed_at column to call_logs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'call_logs' 
        AND column_name = 'processed_at'
    ) THEN
        ALTER TABLE public.call_logs ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
