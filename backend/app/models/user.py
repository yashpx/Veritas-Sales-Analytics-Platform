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

class SalesRepCreate(BaseModel):
    """Schema for sales rep creation"""
    sales_rep_first_name: str
    sales_rep_last_name: str
    email: EmailStr
    phone_number: Optional[int] = None
    password: str = Field(..., min_length=6)

class SalesRepLogin(BaseModel):
    """Schema for sales rep login"""
    email: EmailStr
    password: str

class SalesRepResponse(BaseModel):
    """Schema for returning sales rep data"""
    id: int
    full_name: str
    email: str
    role: str

class SalesRepTokenResponse(BaseModel):
    """Schema for sales rep token response"""
    access_token: str
    token_type: str = "bearer"
    user_data: SalesRepResponse