# Standard library
from datetime import date, datetime
from typing import Optional

# Third-party
from pydantic import BaseModel


def supabase_job_to_response(data: dict) -> "JobResponse":
    """Convert a single Supabase job row (dict) to a JobResponse model."""
    return JobResponse(
        id=data["id"],
        user_id=data["user_id"],
        company=data["company"],
        role=data["role"],
        description=data.get("description"),
        salary=data.get("salary"),
        link=data.get("link"),
        status=data["status"],
        source=data.get("source", "manual"),
        source_url=data.get("source_url"),
        scraped_at=data.get("scraped_at"),
        date_submitted=data.get("date_submitted"),
        created_at=data["created_at"],
    )

def supabase_jobs_to_response(data: list[dict]) -> list["JobResponse"]:
    """Convert a list of Supabase job rows to a list of JobResponse models."""
    jobs = []
    for job in data:
        jobs.append(supabase_job_to_response(job))

    return jobs


class JobCreate(BaseModel):
    """Request model for creating a new job entry manually."""
    company: str
    role: str
    description: Optional[str] = None
    salary: Optional[str] = None
    link: Optional[str] = None
    status: str
    date_submitted: Optional[date] = None


class JobResponse(BaseModel):
    """Response model returned for a single job. Includes all fields stored in the database."""
    id: int 
    user_id: int
    company: Optional[str]
    role: Optional[str]
    description: Optional[str] = None
    salary: Optional[str] = None
    link: Optional[str] = None
    status: str = "pending"
    source: str = "manual"
    source_url: Optional[str] = None
    scraped_at: Optional[datetime] = None
    date_submitted: Optional[date] = None
    created_at: Optional[datetime] = None
