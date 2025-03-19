#!/usr/bin/env python3
"""
Script to add columns to the call_logs table in Supabase using SQL queries.
This script uses the Supabase REST API to execute SQL queries.
"""
import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def add_columns_to_supabase():
    """Add columns to the call_logs table in Supabase."""
    # Get Supabase URL and key from environment variables
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL or SUPABASE_KEY not set in environment variables")
        sys.exit(1)
    
    # Construct the REST API URL for SQL queries
    rest_url = f"{supabase_url}/rest/v1/rpc/execute_sql"
    
    # Set headers for authentication
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }
    
    # SQL query to add the insights column
    insights_sql = """
    ALTER TABLE call_logs 
    ADD COLUMN IF NOT EXISTS insights JSONB DEFAULT NULL;
    """
    
    # SQL query to add the processed_at column
    processed_at_sql = """
    ALTER TABLE call_logs 
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    """
    
    # Execute the SQL queries
    print("Adding 'insights' column...")
    try:
        response = requests.post(
            rest_url,
            headers=headers,
            json={"sql": insights_sql}
        )
        response.raise_for_status()
        print("Added 'insights' column successfully")
    except requests.exceptions.RequestException as e:
        print(f"Error adding 'insights' column: {e}")
    
    print("Adding 'processed_at' column...")
    try:
        response = requests.post(
            rest_url,
            headers=headers,
            json={"sql": processed_at_sql}
        )
        response.raise_for_status()
        print("Added 'processed_at' column successfully")
    except requests.exceptions.RequestException as e:
        print(f"Error adding 'processed_at' column: {e}")
    
    print("\nSchema update completed")

if __name__ == "__main__":
    add_columns_to_supabase()
