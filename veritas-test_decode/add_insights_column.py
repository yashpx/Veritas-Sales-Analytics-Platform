import os
import sys
import json
from supabase import create_client, Client

# Get Supabase credentials from environment variables or hardcoded values
supabase_url = os.environ.get('SUPABASE_URL', 'https://coghrwmmyyzmbnndlawi.supabase.co')
supabase_key = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4OTcyMjUsImV4cCI6MjA1NjQ3MzIyNX0.WLm0l2UeFPiPNxyClnM4bQpxw4TcYFxleTdc7K0G6AM')

# Initialize Supabase client
supabase: Client = create_client(supabase_url, supabase_key)

def add_insights_column():
    """Add insights and processed_at columns to call_logs table if they don't exist"""
    try:
        # Read SQL script
        with open('add_insights_column.sql', 'r') as f:
            sql = f.read()
        
        # Execute SQL script
        result = supabase.rpc('exec_sql', {'query': sql}).execute()
        
        print("Successfully executed SQL script to add columns")
        print("Checking call_logs table structure...")
        
        # Check if columns were added
        result = supabase.table('call_logs').select('*').limit(1).execute()
        if result.data:
            columns = list(result.data[0].keys())
            print(f"Call logs columns: {columns}")
            if 'insights' in columns and 'processed_at' in columns:
                print("✅ Insights and processed_at columns added successfully")
            else:
                missing = []
                if 'insights' not in columns:
                    missing.append('insights')
                if 'processed_at' not in columns:
                    missing.append('processed_at')
                print(f"❌ Columns still missing: {missing}")
        else:
            print("No data found in call_logs table")
        
    except Exception as e:
        print(f"Error adding columns: {e}")
        sys.exit(1)

if __name__ == "__main__":
    add_insights_column()
