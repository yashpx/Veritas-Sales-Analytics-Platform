"""
Supabase configuration for the Veritas project.
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://coghrwmmyyzmbnndlawi.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

def get_supabase_client() -> Client:
    """
    Get a Supabase client instance.
    
    Returns:
        Client: A Supabase client instance.
    """
    if not SUPABASE_KEY:
        raise ValueError("SUPABASE_KEY environment variable is not set")
    
    return create_client(SUPABASE_URL, SUPABASE_KEY)
