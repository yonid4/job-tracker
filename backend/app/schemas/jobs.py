# Standard library
from datetime import date, datetime
from typing import Optional

# Third-party
from pydantic import BaseModel


def supabase_job_to_response(data: dict) -> "JobResponse":
    return JobResponse(
        id=data["id"],
        user_id=data["user_id"],
        company=data["company"],
        role=data["role"],
        description=data.get("description"),
        salary=data.get("salary"),
        link=data.get("link"),
        status=data["status"],
        date_submitted=data.get("date_submitted"),
        created_at=data["created_at"],
    )


class JobCreate(BaseModel):
    company: str
    role: str
    description: Optional[str] = None
    salary: Optional[str] = None
    link: Optional[str] = None
    status: str
    date_submitted: Optional[date] = None


class JobResponse(BaseModel):
    id: int
    user_id: int
    company: Optional[str]
    role: Optional[str]
    description: Optional[str] = None
    salary: Optional[str] = None
    link: Optional[str] = None
    status: str = "pending"
    date_submitted: Optional[date] = None
    created_at: datetime
