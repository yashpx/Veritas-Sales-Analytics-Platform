-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  start TIMESTAMP WITH TIME ZONE NOT NULL,
  end TIMESTAMP WITH TIME ZONE NOT NULL,
  client TEXT,
  notes TEXT,
  reminder INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
-- Enable Row Level Security
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to select their own events
CREATE POLICY "Users can view their own events" 
  ON calendar_events 
  FOR SELECT 
  USING (auth.uid() = created_by);

-- Create policy for authenticated users to insert their own events
CREATE POLICY "Users can insert their own events" 
  ON calendar_events 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Create policy for authenticated users to update their own events
CREATE POLICY "Users can update their own events" 
  ON calendar_events 
  FOR UPDATE 
  USING (auth.uid() = created_by);

-- Create policy for authenticated users to delete their own events
CREATE POLICY "Users can delete their own events" 
  ON calendar_events 
  FOR DELETE 
  USING (auth.uid() = created_by);

-- Add created_by column to track which user created the event
ALTER TABLE calendar_events ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Create index for faster queries
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX idx_calendar_events_start ON calendar_events(start);
CREATE INDEX idx_calendar_events_type ON calendar_events(type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON calendar_events
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
