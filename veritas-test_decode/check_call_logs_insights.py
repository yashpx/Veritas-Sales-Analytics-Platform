#!/usr/bin/env python3
"""
Script to check if insights were stored in the call_logs table.
"""
import os
import sys
import json
from dotenv import load_dotenv

# Add parent directory to path to import supabase_config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from supabase_config import get_supabase_client

# Load environment variables
load_dotenv()

def check_call_logs_insights():
    """Check if insights were stored in the call_logs table."""
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Query the call_logs table
        response = supabase.table("call_logs").select("call_id, insights, call_date").order("call_date", desc=True).limit(10).execute()
        
        if hasattr(response, 'data'):
            print("\nLatest call logs with insights:")
            for record in response.data:
                call_id = record.get('call_id')
                insights = record.get('insights')
                call_date = record.get('call_date')
                
                if insights:
                    print(f"\nCall ID: {call_id}")
                    print(f"Call Date: {call_date}")
                    print(f"Insights: {json.dumps(insights, indent=2)[:200]}... (truncated)")
                else:
                    print(f"\nCall ID: {call_id}")
                    print(f"Call Date: {call_date}")
                    print("No insights stored")
        else:
            print("Error: Could not retrieve call logs")
            
    except Exception as e:
        print(f"Error checking call logs: {e}")

if __name__ == "__main__":
    check_call_logs_insights()
