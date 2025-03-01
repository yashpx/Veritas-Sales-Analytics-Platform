from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.supabase_client import get_supabase
from typing import Optional

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