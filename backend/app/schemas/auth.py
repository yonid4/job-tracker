# Standard library
from typing import Optional

# Third-party
from pydantic import BaseModel, EmailStr, Field

class SignUpRequest(BaseModel):
    """
    Request model for user signup.
    
    Frontend sends this when creating a new account.
    """

    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    username: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "email": "yoni@job-tracker.com",
                "password": "mypassword123",
                "username": "Yoni",
            }
        }

class LoginRequest(BaseModel):
    """
    Request model for user login.
    
    Frontend sends this when logging in.
    """

    email: EmailStr
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "email": "yoni@job-tracker.com",
                "password": "mypassword123"
            }
        }

class Token(BaseModel):
    """
    Response model for successful login.
    
    Backend sends this after successful authentication.
    """
    access_token: str
    token_type: str = "bearer"
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }
    
class TokenData(BaseModel):
    email: str | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "email": "yoni@job-tracker.com"
            }
        }