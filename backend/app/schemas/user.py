# Standard library
from datetime import datetime

# Third-party
from pydantic import BaseModel, EmailStr


def supabase_user_to_response(data: dict) -> "UserResponse":
    return UserResponse(
        id=data["id"],
        username=data["username"],
        email=data["email"],
        created_at=data["created_at"],
    )


class UserResponse(BaseModel):
    """
    Response model for user data.
    
    Backend sends this when returning user information.
    Does not include password_hash
    """

    id: int
    username: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "yoni@job-tracker.com",
                "username": "Yoni",
                "created_at": "2024-12-16T10:30:00"
            }
        }