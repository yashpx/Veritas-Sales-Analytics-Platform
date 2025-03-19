#!/usr/bin/env python3
"""
Script to update the Supabase schema by adding the necessary columns
to the call_logs table for storing insights data using the Supabase API.
"""
import os
import sys
import json
from dotenv import load_dotenv

# Add parent directory to path to import supabase_config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from supabase_config import get_supabase_client

# Load environment variables
load_dotenv()

def update_schema_via_api():
    """Update the schema using Supabase API (RPC calls)."""
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Check if the columns already exist
        print("Checking current schema...")
        response = supabase.rpc(
            'get_column_info',
            {
                'table_name': 'call_logs'
            }
        ).execute()
        
        if hasattr(response, 'data'):
            columns = response.data
            column_names = [col['column_name'] for col in columns]
            
            # Check if insights column exists
            if 'insights' not in column_names:
                print("Adding 'insights' column...")
                supabase.rpc(
                    'add_column',
                    {
                        'table_name': 'call_logs',
                        'column_name': 'insights',
                        'column_type': 'jsonb'
                    }
                ).execute()
                print("Added 'insights' column successfully")
            else:
                print("'insights' column already exists")
            
            # Check if processed_at column exists
            if 'processed_at' not in column_names:
                print("Adding 'processed_at' column...")
                supabase.rpc(
                    'add_column',
                    {
                        'table_name': 'call_logs',
                        'column_name': 'processed_at',
                        'column_type': 'timestamp with time zone'
                    }
                ).execute()
                print("Added 'processed_at' column successfully")
            else:
                print("'processed_at' column already exists")
            
            print("\nSchema update completed successfully")
        else:
            print("Error: Could not retrieve column information")
            sys.exit(1)
        
    except Exception as e:
        print(f"Error updating schema: {e}")
        sys.exit(1)

def create_rpc_functions():
    """Create RPC functions in Supabase for schema management."""
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Create get_column_info function
        print("Creating get_column_info function...")
        supabase.rpc(
            'create_function',
            {
                'function_name': 'get_column_info',
                'function_definition': """
                CREATE OR REPLACE FUNCTION get_column_info(table_name text)
                RETURNS TABLE(column_name text, data_type text) AS $$
                BEGIN
                    RETURN QUERY SELECT 
                        columns.column_name::text, 
                        columns.data_type::text
                    FROM 
                        information_schema.columns 
                    WHERE 
                        columns.table_name = table_name;
                END;
                $$ LANGUAGE plpgsql SECURITY DEFINER;
                """
            }
        ).execute()
        
        # Create add_column function
        print("Creating add_column function...")
        supabase.rpc(
            'create_function',
            {
                'function_name': 'add_column',
                'function_definition': """
                CREATE OR REPLACE FUNCTION add_column(
                    table_name text,
                    column_name text,
                    column_type text
                ) RETURNS void AS $$
                DECLARE
                    column_exists boolean;
                    sql_statement text;
                BEGIN
                    -- Check if column already exists
                    SELECT EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_name = add_column.table_name
                        AND column_name = add_column.column_name
                    ) INTO column_exists;
                    
                    -- Add column if it doesn't exist
                    IF NOT column_exists THEN
                        sql_statement := 'ALTER TABLE ' || table_name || 
                                        ' ADD COLUMN ' || column_name || 
                                        ' ' || column_type || ' DEFAULT NULL';
                        EXECUTE sql_statement;
                    END IF;
                END;
                $$ LANGUAGE plpgsql SECURITY DEFINER;
                """
            }
        ).execute()
        
        print("RPC functions created successfully")
        
    except Exception as e:
        print(f"Error creating RPC functions: {e}")
        print("Continuing with schema update...")

if __name__ == "__main__":
    # First try to create the RPC functions (may fail if user doesn't have permissions)
    try:
        create_rpc_functions()
    except:
        print("Could not create RPC functions. Will try direct SQL approach.")
    
    # Update the schema
    update_schema_via_api()
    
    print("\nSchema update completed. You can now use the webhook server to store insights in the database.")
