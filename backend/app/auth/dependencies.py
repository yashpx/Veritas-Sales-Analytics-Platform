from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.supabase_client import get_supabase, decode_sales_rep_token
from typing import Optional, Dict, Any, Union

# HTTP Bearer token scheme for JWT authorization
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validate the JWT token in the Authorization header and return the user data.
    This dependency can be used to protect routes that require authentication.
    """
    token = credentials.credentials
    supabase = get_supabase()
    
    try:
        # Verify the JWT token and get user data
        response = supabase.auth.get_user(token)
        user = response.user
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Optional version of the dependency for routes that can work with or without authentication
async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    """
    Similar to get_current_user but doesn't raise an exception if no token is provided.
    Returns None if no token or invalid token.
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    supabase = get_supabase()
    
    try:
        response = supabase.auth.get_user(token)
        return response.user
    except Exception:
        return None

async def get_current_sales_rep(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validate a sales rep JWT token in the Authorization header and return the sales rep data.
    This dependency can be used to protect routes that require sales rep authentication.
    """
    token = credentials.credentials
    
    try:
        # First try to decode the token as a sales rep token
        payload = decode_sales_rep_token(token)
        
        # Check if this is a sales rep token
        if payload.get("auth_type") != "sales_rep":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid sales rep credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Return user data from the payload
        return {
            "id": int(payload["sub"]),
            "email": payload["email"],
            "full_name": payload.get("full_name", ""),
            "role": payload.get("role", "sales_rep"),
            "auth_type": "sales_rep"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid sales rep credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_any_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Try to authenticate with either Supabase auth or custom sales rep auth.
    Returns user data from either authentication method.
    """
    token = credentials.credentials
    
    # Try sales rep authentication first
    try:
        payload = decode_sales_rep_token(token)
        if payload.get("auth_type") == "sales_rep":
            return {
                "id": int(payload["sub"]),
                "email": payload["email"],
                "full_name": payload.get("full_name", ""),
                "role": payload.get("role", "sales_rep"),
                "auth_type": "sales_rep"
            }
    except Exception:
        pass
    
    # Fall back to Supabase authentication
    try:
        supabase = get_supabase()
        response = supabase.auth.get_user(token)
        user = response.user
        
        if user:
            return {
                "id": user.id,
                "email": user.email,
                "created_at": user.created_at,
                "last_sign_in_at": user.last_sign_in_at,
                "user_metadata": user.user_metadata,
                "auth_type": "supabase"
            }
    except Exception:
        pass
    
    # If we get here, authentication failed
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )