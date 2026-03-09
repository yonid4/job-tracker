from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.jobs import JobResponse


class ScrapeRequest(BaseModel):
    """
    Body sent to POST /scrape.
    All filters are optional — only keywords and location are required.
    """
    keywords: str = Field(..., description="Job title or keywords, e.g. 'software engineer'")
    location: str = Field(..., description="City, state, or remote, e.g. 'New York, NY'")
    sites: list[str] = Field(
        default=["linkedin", "indeed"],
        description="Job sites to scrape. Options: linkedin, indeed, glassdoor, zip_recruiter"
    )
    results_per_site: int = Field(default=20, ge=1, le=100)
    hours_old: Optional[int] = Field(default=72, description="Only return jobs posted within N hours")
    is_remote: bool = False
    distance: int = Field(default=50, ge=1, description="Search radius in miles")
    job_type: Optional[str] = Field(
        default=None,
        description="fulltime | parttime | internship | contract"
    )
    auto_save: bool = Field(
        default=False,
        description="If True, automatically save all results to the jobs table"
    )


class ScrapeResponse(BaseModel):
    """Response returned after a scrape job completes, with results and any errors."""
    success: bool
    total_found: int
    saved_count: int
    results: list[JobResponse]
    errors: list[str] = [] 