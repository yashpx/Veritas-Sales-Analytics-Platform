#!/usr/bin/env python3
"""
Script to update the Supabase schema by adding the necessary columns
to the call_logs table for storing insights data.
"""
import os
import sys
import psycopg2
from dotenv import load_dotenv

# Add parent directory to path to import supabase_config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from supabase_config import get_supabase_client

# Load environment variables
load_dotenv()

def get_connection_string():
    """Get PostgreSQL connection string from environment variables."""
    supabase_url = os.getenv("SUPABASE_URL", "")
    supabase_key = os.getenv("SUPABASE_KEY", "")
    
    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL or SUPABASE_KEY not set in environment variables")
        sys.exit(1)
    
    # For direct database access, we need the connection info from Supabase dashboard
    # This information should be available in the Database settings > Connection pooling
    print("Please enter the database connection details from Supabase dashboard:")
    host = input("Host (e.g., db.coghrwmmyyzmbnndlawi.supabase.co): ")
    db_name = input("Database name (default: postgres): ") or "postgres"
    user = input("User (default: postgres): ") or "postgres"
    password = input("Password: ")
    port = input("Port (default: 5432): ") or "5432"
    
    return f"postgresql://{user}:{password}@{host}:{port}/{db_name}"

def execute_sql_file(file_path):
    """Execute SQL commands from a file."""
    try:
        conn_string = get_connection_string()
        conn = psycopg2.connect(conn_string)
        cursor = conn.cursor()
        
        with open(file_path, 'r') as f:
            sql = f.read()
        
        cursor.execute(sql)
        conn.commit()
        
        print(f"Successfully executed SQL from {file_path}")
        
        # Verify the columns were added
        cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'call_logs'")
        columns = cursor.fetchall()
        print("\nColumns in call_logs table:")
        for col in columns:
            print(f"  {col[0]} ({col[1]})")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error executing SQL: {e}")
        sys.exit(1)

if __name__ == "__main__":
    sql_file = os.path.join(os.path.dirname(__file__), "add_columns.sql")
    
    if not os.path.exists(sql_file):
        print(f"Error: SQL file {sql_file} not found")
        sys.exit(1)
    
    execute_sql_file(sql_file)
    print("\nSchema update completed successfully")
