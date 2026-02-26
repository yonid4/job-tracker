# Standard library
from datetime import date, datetime
from typing import Optional

# Third-party
from pydantic import BaseModel


class Job(BaseModel):
    id: Optional[int] = None
    user_id: int
    company: str
    role: str
    description: Optional[str] = None
    salary: Optional[str] = None
    link: Optional[str] = None
    status: str
    date_submitted: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

