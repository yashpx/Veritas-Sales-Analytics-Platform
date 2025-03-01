from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class UserCreate(BaseModel):
    """Schema for user creation request data"""
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    """Schema for user login request data"""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Schema for returning user data"""
    id: str
    email: EmailStr
    created_at: Optional[datetime] = None
    last_sign_in_at: Optional[datetime] = None
    user_metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    """Schema for updating user profile data"""
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    website: Optional[str] = None
    
class TokenResponse(BaseModel):
    """Schema for token response data"""
    access_token: str
    token_type: str = "bearer"