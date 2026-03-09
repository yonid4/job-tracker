import asyncio
from datetime import datetime, timezone
from typing import Optional

import jobspy
import pandas as pd

from app.database import supabase
from app.models.jobs import Job
from app.schemas.jobs import JobResponse, supabase_job_to_response
from app.schemas.scraper import ScrapeRequest


# Map jobspy site names to our internal source labels
SITE_MAP = {
    "linkedin": "linkedin",
    "indeed": "indeed",
    "glassdoor": "glassdoor",
    "zip_recruiter": "zip_recruiter",
}


def _scrape_sync(request: ScrapeRequest) -> pd.DataFrame:
    """
    Synchronous jobspy call — run via asyncio.to_thread to avoid blocking.
    """
    kwargs: dict = {
        "site_name": request.sites,
        "search_term": request.keywords,
        "location": request.location,
        "results_wanted": request.results_per_site,
        "distance": request.distance,
        "is_remote": request.is_remote,
    }
    if request.hours_old is not None:
        kwargs["hours_old"] = request.hours_old
    if request.job_type is not None:
        kwargs["job_type"] = request.job_type
    return jobspy.scrape_jobs(**kwargs)


def _row_to_job(row: pd.Series, user_id: int) -> Job:
    """
    Convert a single jobspy DataFrame row into our Job model.
    """
    # jobspy provides salary as min/max integers — format as string to match existing schema
    salary = None
    if pd.notna(row.get("min_amount")) and pd.notna(row.get("max_amount")):
        salary = f"${int(row['min_amount']):,} - ${int(row['max_amount']):,}"
    elif pd.notna(row.get("min_amount")):
        salary = f"${int(row['min_amount']):,}+"

    return Job(
        user_id=user_id,
        company=str(row.get("company", "Unknown")),
        role=str(row.get("title", "Unknown")),
        description=str(row.get("description", ""))[:5000] if pd.notna(row.get("description")) else None,
        salary=salary,
        link=str(row.get("job_url", "")) if pd.notna(row.get("job_url")) else None,
        status="pending",
        source=SITE_MAP.get(str(row.get("site", "")), "scraped"),
        source_url=str(row.get("job_url", "")) if pd.notna(row.get("job_url")) else None,
        scraped_at=datetime.now(timezone.utc),
    )


async def run_scrape(
    request: ScrapeRequest,
    user_id: int,
) -> tuple[list[JobResponse], list[str]]:
    """
    Main entry point called by the route.
    Returns (job_responses, errors).
    """
    errors: list[str] = []

    # Run jobspy in a thread so we don't block the event loop
    try:
        df: pd.DataFrame = await asyncio.to_thread(_scrape_sync, request)
    except Exception as e:
        return [], [f"Scraping failed: {str(e)}"]

    if df.empty:
        return [], []

    jobs: list[Job] = []
    for _, row in df.iterrows():
        try:
            jobs.append(_row_to_job(row, user_id))
        except Exception as e:
            errors.append(f"Row parse error: {str(e)}")

    if not request.auto_save:
        # Return results without persisting — user will choose what to save
        return [
            JobResponse(
                id=-1,
                user_id=user_id,
                company=j.company,
                role=j.role,
                description=j.description,
                salary=j.salary,
                link=j.link,
                status=j.status,
                source=j.source,
                source_url=j.source_url,
                scraped_at=j.scraped_at,
            )
            for j in jobs
        ], errors

    # auto_save=True: insert all into Supabase
    saved: list[JobResponse] = []
    for job in jobs:
        try:
            result = supabase.table("jobs").insert(
                job.model_dump(exclude={"id", "created_at", "updated_at"}, exclude_none=True, mode="json")
            ).execute()
            saved.append(supabase_job_to_response(result.data[0]))
        except Exception as e:
            errors.append(f"Save failed for '{job.role}' at '{job.company}': {str(e)}")

    return saved, errors