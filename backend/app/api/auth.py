from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.utils.supabase_client import get_supabase
from app.auth.dependencies import get_current_user

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
async def get_current_user_info(user: dict = Depends(get_current_user)):
    """
    Get information about the currently authenticated user
    """
    return {
        "id": user.id,
        "email": user.email,
        "created_at": user.created_at,
        "last_sign_in_at": user.last_sign_in_at,
        "user_metadata": user.user_metadata
    }