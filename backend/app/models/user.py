from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime
from uuid import UUID

class Organization(BaseModel):
    """Schema for organization data"""
    organization_id: UUID
    name: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class OrganizationCreate(BaseModel):
    """Schema for organization creation"""
    name: str

class UserRole(BaseModel):
    """Schema for user role information"""
    role: Literal["manager", "sales_rep"]
    organization_id: UUID

class UserCreate(BaseModel):
    """Schema for user creation request data"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Literal["manager", "sales_rep"]
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    organization_id: Optional[str] = None  # If None and role is manager, create new org
    organization_name: Optional[str] = None  # For creating a new organization

class UserLogin(BaseModel):
    """Schema for user login request data"""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Schema for returning basic user data"""
    id: str
    email: EmailStr
    created_at: Optional[datetime] = None
    last_sign_in_at: Optional[datetime] = None
    user_metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class UserProfileResponse(BaseModel):
    """Schema for returning user profile data with role and organization"""
    id: str
    email: EmailStr
    organization_id: Optional[UUID] = None
    role: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class UserProfileUpdate(BaseModel):
    """Schema for updating user profile data"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    
class TokenResponse(BaseModel):
    """Schema for token response data"""
    access_token: str
    token_type: str = "bearer"

class SalesRepCreate(BaseModel):
    """Schema for creating a sales rep (with or without user account)"""
    organization_id: UUID
    sales_rep_first_name: str
    sales_rep_last_name: str
    email: Optional[EmailStr] = None
    phone_number: Optional[int] = None
    user_id: Optional[str] = None

class SalesRepResponse(BaseModel):
    """Schema for returning sales rep data"""
    sales_rep_id: int
    organization_id: UUID
    user_id: Optional[str] = None
    sales_rep_first_name: str
    sales_rep_last_name: str
    phone_number: Optional[int] = None
    email: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None