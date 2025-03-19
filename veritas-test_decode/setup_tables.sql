SUPABASE_URL=https://coghrwmmyyzmbnndlawi.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDg5NzIyNSwiZXhwIjoyMDU2NDczMjI1fQ.1fqLT8KBSi6IVsZNZkgs4-n-yrhz2u1Rp4vFeTJ_LX0-- Create the call_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id TEXT,
    callee_id TEXT,
    call_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    call_duration INTEGER,
    transcription TEXT,
    audio_url TEXT,
    insights JSONB,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the call_analysis table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.call_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_log_id UUID REFERENCES call_logs(id),
    analysis_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to send webhook
CREATE OR REPLACE FUNCTION call_logs_webhook_function()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.transcription IS NOT NULL) THEN
        -- Replace 'YOUR_WEBHOOK_URL' with your actual webhook URL
        PERFORM net.http_post(
            'https://b0ab-176-205-223-200.ngrok-free.app/webhook',
            json_build_object(
                'type', TG_OP,
                'table', TG_TABLE_NAME,
                'schema', TG_TABLE_SCHEMA,
                'record', row_to_json(NEW),
                'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
            )::text,
            'application/json'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS call_logs_webhook_trigger ON call_logs;

-- Create a trigger to call the function
CREATE TRIGGER call_logs_webhook_trigger
AFTER INSERT OR UPDATE ON call_logs
FOR EACH ROW
EXECUTE FUNCTION call_logs_webhook_function();
