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
    source: str = "manual"
    source_url: Optional[str] = None
    scraped_at: Optional[datetime] = None
    job_level: Optional[str] = None
    date_submitted: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ScrapeRequest(BaseModel):
    ... # TODO: add scrape request fields

class ScrapeResponse(BaseModel):
    ... # TODO: add scrape response fields