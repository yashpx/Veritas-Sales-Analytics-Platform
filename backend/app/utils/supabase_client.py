from supabase import create_client, Client
from config.settings import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

def get_supabase() -> Client:
    """
    Creates and returns a Supabase client using the anon key.
    This client is suitable for client-side operations with limited permissions.
    """
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def get_supabase_admin() -> Client:
    """
    Creates and returns a Supabase client using the service role key.
    This client has full admin access to the database and should only be used
    for server-side operations that require elevated permissions.
    """
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)