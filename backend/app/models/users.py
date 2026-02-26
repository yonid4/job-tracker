# Standard library
from datetime import datetime
from typing import Optional

# Third-party
from pydantic import BaseModel, EmailStr


class User(BaseModel):
    id: Optional[int] = None
    username: str
    email: EmailStr
    password_hash: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
