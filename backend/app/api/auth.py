from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import (
    UserCreate, UserLogin, UserResponse, UserProfileResponse, TokenResponse,
    OrganizationCreate, Organization, SalesRepCreate, SalesRepResponse
)
from app.utils.supabase_client import get_supabase, get_supabase_admin
from app.auth.dependencies import get_current_user, get_user_profile, get_manager
from uuid import UUID, uuid4
from typing import List

router = APIRouter()

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user with email and password.
    For managers, create a new organization if one isn't provided.
    For sales reps, organization_id is required.
    """
    supabase = get_supabase()
    supabase_admin = get_supabase_admin()
    
    try:
        # If user is a sales rep, verify organization exists
        if user_data.role == "sales_rep" and not user_data.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sales representatives must be associated with an organization"
            )
            
        # If user is a manager without an organization, create one
        organization_id = user_data.organization_id
        if user_data.role == "manager" and not organization_id:
            # Use provided org name or create a default one
            org_name = user_data.organization_name or f"{user_data.first_name or 'New'}'s Organization"
            
            try:
                org_response = supabase.from_("organizations").insert({
                    "name": org_name
                }).execute()
                
                if hasattr(org_response, 'error') and org_response.error:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Error creating organization: {org_response.error.message}"
                    )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error creating organization: {str(e)}"
                )
                
            organization_id = org_response.data[0]["organization_id"]
        
        # Create auth user - using regular signup instead of admin API
        try:
            # Use regular signup instead of admin since that's causing issues
            auth_response = supabase.auth.sign_up({
                "email": user_data.email,
                "password": user_data.password
            })
            
            if hasattr(auth_response, 'error') and auth_response.error:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=auth_response.error.message
                )
                
            # Check if user is available in the response
            if not hasattr(auth_response, 'user') or not auth_response.user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="User not created properly"
                )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error creating user: {str(e)}"
            )
            
        # Access user ID from the data structure
        user_id = auth_response.user.id
        
        # Create user profile
        profile_data = {
            "user_id": user_id,
            "organization_id": str(organization_id),
            "role": user_data.role,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name
        }
        
        try:
            profile_response = supabase.from_("user_profiles").insert(profile_data).execute()
            
            if hasattr(profile_response, 'error') and profile_response.error:
                # Clean up auth user if profile creation fails
                supabase_admin.auth.admin.delete_user(user_id)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error creating user profile: {profile_response.error.message}"
                )
        except Exception as e:
            # Clean up auth user if profile creation fails
            try:
                supabase_admin.auth.admin.delete_user(user_id)
            except:
                pass
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating user profile: {str(e)}"
            )
        
        # If role is sales rep, also create sales_rep record
        if user_data.role == "sales_rep":
            sales_rep_data = {
                "organization_id": str(organization_id),
                "user_id": user_id,
                "sales_rep_first_name": user_data.first_name or "",
                "sales_rep_last_name": user_data.last_name or ""
            }
            
            try:
                sales_rep_response = supabase.from_("sales_reps").insert(sales_rep_data).execute()
                
                if hasattr(sales_rep_response, 'error') and sales_rep_response.error:
                    # Clean up if sales rep creation fails
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Error creating sales rep record: {sales_rep_response.error.message}"
                    )
            except Exception as e:
                # We don't delete the user here since they at least have a profile
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error creating sales rep record: {str(e)}"
                )
            
        return {
            "message": "Registration successful.",
            "user_id": user_id,
            "organization_id": str(organization_id),
            "role": user_data.role
        }
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    """
    Authenticate a user and return a JWT token
    """
    supabase = get_supabase()
    
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user_data.email, 
            "password": user_data.password
        })
        
        if hasattr(response, 'error') and response.error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
            
        # Check if session exists
        if not hasattr(response, 'session') or not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login failed - no session created"
            )
            
        return {
            "access_token": response.session.access_token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    """
    Log out the current user by invalidating their session
    """
    supabase = get_supabase()
    
    try:
        response = supabase.auth.sign_out()
        if hasattr(response, 'error') and response.error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=response.error.message
            )
        
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_info(user_profile: dict = Depends(get_user_profile)):
    """
    Get profile information about the currently authenticated user including role and organization
    """
    return user_profile

@router.post("/organizations", response_model=Organization, status_code=status.HTTP_201_CREATED)
async def create_organization(org_data: OrganizationCreate, user_profile: dict = Depends(get_manager)):
    """
    Create a new organization - only available to managers
    """
    supabase = get_supabase()
    
    try:
        response = supabase.from_("organizations").insert({
            "name": org_data.name
        }).execute()
        
        if response.error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating organization: {response.error.message}"
            )
            
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/organizations/{organization_id}", response_model=Organization)
async def get_organization(organization_id: UUID, user_profile: dict = Depends(get_user_profile)):
    """
    Get organization details - user must be a member of the organization
    """
    if str(organization_id) != str(user_profile["organization_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You don't have access to this organization."
        )
    
    supabase = get_supabase()
    
    try:
        response = supabase.from_("organizations").select("*").eq("organization_id", str(organization_id)).execute()
        
        if response.error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error fetching organization: {response.error.message}"
            )
            
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
            
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/sales-reps", response_model=SalesRepResponse, status_code=status.HTTP_201_CREATED)
async def create_sales_rep(sales_rep_data: SalesRepCreate, user_profile: dict = Depends(get_manager)):
    """
    Create a new sales rep entry (with or without user account)
    Only managers can create sales reps
    """
    # Check that manager is creating for their own organization
    if str(sales_rep_data.organization_id) != str(user_profile["organization_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create sales reps for your own organization"
        )
    
    supabase = get_supabase()
    
    try:
        response = supabase.from_("sales_reps").insert({
            "organization_id": str(sales_rep_data.organization_id),
            "user_id": sales_rep_data.user_id,
            "sales_rep_first_name": sales_rep_data.sales_rep_first_name,
            "sales_rep_last_name": sales_rep_data.sales_rep_last_name,
            "Phone Number": sales_rep_data.phone_number,
            "Email": sales_rep_data.email
        }).execute()
        
        if response.error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating sales rep: {response.error.message}"
            )
            
        return response.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/sales-reps", response_model=List[SalesRepResponse])
async def get_sales_reps(user_profile: dict = Depends(get_user_profile)):
    """
    Get all sales reps for the user's organization
    """
    supabase = get_supabase()
    
    try:
        response = supabase.from_("sales_reps").select("*").eq(
            "organization_id", str(user_profile["organization_id"])
        ).execute()
        
        if response.error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error fetching sales reps: {response.error.message}"
            )
            
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )