from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.supabase_client import get_supabase, get_supabase_admin
from typing import Optional, Literal
from uuid import UUID

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

async def get_user_profile(user = Depends(get_current_user)):
    """
    Get the user profile data from the user_profiles table including their role and organization
    """
    supabase = get_supabase()
    
    try:
        response = supabase.from_("user_profiles").select("*").eq("user_id", user.id).execute()
        
        if response.error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error fetching user profile: {response.error.message}"
            )
            
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
            
        # Merge auth user data with profile data
        user_profile = response.data[0]
        user_profile["id"] = user.id
        user_profile["email"] = user.email
        
        return user_profile
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user profile: {str(e)}"
        )

async def get_user_with_role(
    allowed_roles: list[Literal["manager", "sales_rep"]] = None,
    user_profile = Depends(get_user_profile)
):
    """
    Verify the user has one of the allowed roles and return the user profile.
    If allowed_roles is None, any authenticated user with a profile is allowed.
    """
    if allowed_roles and user_profile["role"] not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
        )
        
    return user_profile

async def get_manager(user_profile = Depends(get_user_profile)):
    """
    Verify the user is a manager and return the user profile
    """
    if user_profile["role"] != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Manager role required."
        )
        
    return user_profile

async def get_sales_rep(user_profile = Depends(get_user_profile)):
    """
    Verify the user is a sales rep and return the user profile
    """
    if user_profile["role"] != "sales_rep":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Sales representative role required."
        )
        
    return user_profile

async def get_org_member(organization_id: UUID, user_profile = Depends(get_user_profile)):
    """
    Verify the user belongs to the specified organization
    """
    if user_profile["organization_id"] != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You don't have access to this organization."
        )
        
    return user_profile