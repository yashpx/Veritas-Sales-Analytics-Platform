from supabase import create_client, Client
from config.settings import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
from config.settings import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION
from fastapi import HTTPException, status
import bcrypt
import jwt
import time

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

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt for secure storage
    """
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash
    """
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_sales_rep_token(user_id: int, email: str, full_name: str, role: str) -> str:
    """
    Create a JWT token for sales rep authentication
    """
    payload = {
        "sub": str(user_id),
        "email": email,
        "full_name": full_name,
        "role": role,
        "exp": int(time.time()) + JWT_EXPIRATION,
        "iat": int(time.time()),
        "auth_type": "sales_rep"  # Identify this as a sales rep token
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_sales_rep_token(token: str):
    """
    Decode and validate a sales rep JWT token
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )