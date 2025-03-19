from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.models.user import SalesRepCreate, SalesRepLogin, SalesRepResponse, SalesRepTokenResponse
from app.utils.supabase_client import get_supabase, get_supabase_admin, hash_password, verify_password, create_sales_rep_token
from app.auth.dependencies import get_current_user, get_current_sales_rep, get_current_user_any_auth

router = APIRouter()

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user with email and password
    """
    supabase = get_supabase()
    
    try:
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password
        })
        
        if response.error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=response.error.message
            )
            
        return {
            "message": "Registration successful. Please check your email for confirmation.",
            "user_id": response.user.id if response.user else None
        }
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
        
        if response.error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
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
        if response.error:
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

@router.get("/me", response_model=dict)
async def get_current_user_info(user: dict = Depends(get_current_user_any_auth)):
    """
    Get information about the currently authenticated user (either regular user or sales rep)
    """
    return user

@router.post("/sales-rep/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_sales_rep(sales_rep_data: SalesRepCreate, current_user: dict = Depends(get_current_user)):
    """
    Register a new sales rep - only managers can create sales reps
    """
    # Use admin client to work with public tables
    supabase = get_supabase_admin()
    
    try:
        # Check if the email already exists in the user_auth table
        email_exists = supabase.table("user_auth").select("id").eq("email", sales_rep_data.email).execute()
        
        if email_exists.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Insert into sales_reps table first
        sales_rep_insert = supabase.table("sales_reps").insert({
            "sales_rep_first_name": sales_rep_data.sales_rep_first_name,
            "sales_rep_last_name": sales_rep_data.sales_rep_last_name,
            "Email": sales_rep_data.email,
            "Phone Number": sales_rep_data.phone_number
        }).execute()
        
        if not sales_rep_insert.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create sales rep record"
            )
        
        sales_rep_id = sales_rep_insert.data[0]["sales_rep_id"]
        
        # Now insert into user_auth table with hashed password
        hashed_password = hash_password(sales_rep_data.password)
        full_name = f"{sales_rep_data.sales_rep_first_name} {sales_rep_data.sales_rep_last_name}"
        
        user_auth_insert = supabase.table("user_auth").insert({
            "email": sales_rep_data.email,
            "Password": hashed_password,
            "Full Name": full_name,
            "Role": "sales_rep",
            "Is active": True
        }).execute()
        
        if not user_auth_insert.data:
            # Rollback the sales_rep insert if user_auth insert fails
            supabase.table("sales_reps").delete().eq("sales_rep_id", sales_rep_id).execute()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user_auth record"
            )
            
        return {
            "message": "Sales rep registered successfully",
            "sales_rep_id": sales_rep_id,
            "user_auth_id": user_auth_insert.data[0]["id"]
        }
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/sales-rep/login", response_model=SalesRepTokenResponse)
async def login_sales_rep(login_data: SalesRepLogin):
    """
    Authenticate a sales rep using the user_auth table and return a JWT token
    """
    supabase = get_supabase_admin()
    
    try:
        # Find user by email in user_auth table
        user_result = supabase.table("user_auth").select("*").eq("email", login_data.email).execute()
        
        if not user_result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        user_auth = user_result.data[0]
        
        # Check if the user is active
        if not user_auth.get("Is active", False):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is inactive"
            )
        
        # Verify password
        if not verify_password(login_data.password, user_auth["Password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Get sales rep details
        sales_rep_result = supabase.table("sales_reps").select("*").eq("Email", login_data.email).execute()
        
        if not sales_rep_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sales rep not found"
            )
        
        sales_rep = sales_rep_result.data[0]
        
        # Create JWT token
        full_name = user_auth.get("Full Name", f"{sales_rep['sales_rep_first_name']} {sales_rep['sales_rep_last_name']}")
        token = create_sales_rep_token(
            user_id=user_auth["id"],
            email=user_auth["email"],
            full_name=full_name,
            role=user_auth.get("Role", "sales_rep")
        )
        
        # Return token and user info including the sales_rep_id
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_data": {
                "id": user_auth["id"],
                "full_name": full_name,
                "email": user_auth["email"],
                "role": user_auth.get("Role", "sales_rep"),
                "salesRepId": sales_rep["sales_rep_id"]  # Include the sales rep ID
            }
        }
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/sales-rep/me", response_model=dict)
async def get_current_sales_rep_info(user: dict = Depends(get_current_sales_rep)):
    """
    Get information about the currently authenticated sales rep
    """
    return user