# Scraper Migration Plan: job-tracker Integration

> **Goal:** Replace the brittle Selenium-based LinkedIn scraper (JobOS) with a clean,
> maintainable scraping service built on `python-jobspy` — integrated directly into the
> `job-tracker` backend so scraped jobs are persisted to Supabase and users can manage them
> through the existing tracker flow.

---

## Stack

| Layer | Tool | Why |
|-------|------|-----|
| Scraping | [`python-jobspy`](https://pypi.org/project/python-jobspy/) v1.1.82+ | Actively maintained, multi-site, no browser needed |
| Backend | FastAPI (already in job-tracker) | No new framework needed |
| Database | Supabase / PostgreSQL (already in job-tracker) | Persist scraped jobs to existing `jobs` table |
| Auth | Existing JWT (`/auth/me`) | Scraped jobs are scoped to the logged-in user |
| Async | `asyncio.to_thread` | jobspy is sync; wrap it to avoid blocking FastAPI |

---

## Project File Map

All paths are relative to `job-tracker/backend/`.

```
backend/
├── requirements.txt                  ← add python-jobspy, pandas
├── main.py                           ← register new scraper router
├── app/
│   ├── models/
│   │   └── jobs.py                   ← extend Job model with scraper fields
│   ├── schemas/
│   │   ├── jobs.py                   ← extend JobResponse + add ScrapeRequest/ScrapeResponse
│   │   └── scraper.py                ← NEW: ScrapeRequest, ScrapeResponse schemas
│   ├── services/
│   │   └── scraper_service.py        ← NEW: wraps jobspy, returns list[Job]
│   └── routes/
│       └── scraper.py                ← NEW: POST /scrape endpoint
migrations/
└── 002_add_scraper_fields.sql        ← NEW: adds source, source_url, scraped_at columns
```

---

## Phase 1 — Dependencies

**File:** `backend/requirements.txt`

Add:
```
python-jobspy==1.1.82
pandas>=2.0.0
```

> `pandas` is a required dependency of `python-jobspy` — jobspy returns results as a DataFrame.

Install:
```bash
pip install python-jobspy pandas
```

---

## Phase 2 — Database Migration

**File:** `migrations/002_add_scraper_fields.sql`

The existing `jobs` table stores manually entered jobs. We extend it with 3 optional columns so scraped and manual jobs live together:

```sql
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS source       TEXT    DEFAULT 'manual',   -- 'manual' | 'linkedin' | 'indeed' | 'glassdoor' | 'zip_recruiter'
  ADD COLUMN IF NOT EXISTS source_url   TEXT,                       -- direct link to the job posting
  ADD COLUMN IF NOT EXISTS scraped_at   TIMESTAMPTZ;                -- when this job was scraped (NULL for manual entries)
```

Run this in the Supabase SQL editor or via the CLI.

> All three columns are **optional** with defaults — existing manual jobs are unaffected.

---

## Phase 3 — Extend the Job Model

**File:** `backend/app/models/jobs.py`

Add the three new optional fields:

```python
from datetime import date, datetime
from typing import Optional
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

    # --- NEW scraper fields ---
    source: str = "manual"                      # where the job came from
    source_url: Optional[str] = None            # original job posting URL
    scraped_at: Optional[datetime] = None       # populated for scraped jobs
```

---

## Phase 4 — Extend Schemas

### 4a. Update existing `JobResponse` and helper

**File:** `backend/app/schemas/jobs.py`

Update `supabase_job_to_response` and `JobResponse` to include the new fields:

```python
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
        # new fields
        source=data.get("source", "manual"),
        source_url=data.get("source_url"),
        scraped_at=data.get("scraped_at"),
    )


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
    created_at: Optional[datetime] = None
    # new fields
    source: str = "manual"
    source_url: Optional[str] = None
    scraped_at: Optional[datetime] = None
```

### 4b. New scraper schemas

**File:** `backend/app/schemas/scraper.py` ← create this file

```python
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
    is_remote: Optional[bool] = None
    job_type: Optional[str] = Field(
        default=None,
        description="fulltime | parttime | internship | contract"
    )
    auto_save: bool = Field(
        default=False,
        description="If True, automatically save all results to the jobs table"
    )


class ScrapeResponse(BaseModel):
    success: bool
    total_found: int
    saved_count: int                    # 0 if auto_save=False
    results: list[JobResponse]
    errors: list[str] = []             # per-site error messages, if any
```

---

## Phase 5 — Scraper Service

**File:** `backend/app/services/scraper_service.py` ← create this file

This is the core logic layer. It wraps `python-jobspy`, normalises the DataFrame output
into `Job` model instances, and optionally saves them to Supabase.

```python
import asyncio
from datetime import datetime, timezone
from typing import Optional

import jobspy                               # python-jobspy
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
    return jobspy.scrape_jobs(
        site_name=request.sites,
        search_term=request.keywords,
        location=request.location,
        results_wanted=request.results_per_site,
        hours_old=request.hours_old,
        is_remote=request.is_remote,
        job_type=request.job_type,
    )


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
```

---

## Phase 6 — Scraper Route

**File:** `backend/app/routes/scraper.py` ← create this file

```python
from fastapi import APIRouter, Depends
from app.routes.auth import get_current_me
from app.schemas.user import UserResponse
from app.schemas.scraper import ScrapeRequest, ScrapeResponse
from app.services.scraper_service import run_scrape

router = APIRouter(prefix="/scrape", tags=["Scraper"])


@router.post("/", response_model=ScrapeResponse)
async def scrape_jobs(
    request: ScrapeRequest,
    user: UserResponse = Depends(get_current_me),
):
    """
    Scrape jobs from one or more job sites.

    - Set **auto_save=true** to immediately save all results to your job tracker.
    - Set **auto_save=false** (default) to preview results and manually choose which to save
      via `POST /jobs/`.

    Supported sites: `linkedin`, `indeed`, `glassdoor`, `zip_recruiter`
    """
    results, errors = await run_scrape(request, user_id=user.id)

    return ScrapeResponse(
        success=len(errors) == 0 or len(results) > 0,
        total_found=len(results),
        saved_count=len(results) if request.auto_save else 0,
        results=results,
        errors=errors,
    )
```

### Register the router

**File:** `backend/main.py` — add two lines:

```python
from app.routes.scraper import router as scraper_router   # add this import

app.include_router(scraper_router)                        # add this line
```

---

## Phase 7 — Frontend Integration (Next.js)

New UI flow in `frontend/`:

```
frontend/app/
└── scraper/
    └── page.tsx          ← "Import Jobs" page
        ├── ScrapeForm    ← keywords, location, sites, filters
        ├── ResultsTable  ← preview scraped jobs before saving
        └── SaveButton    ← POST individual or all jobs to /jobs/
```

**API call pattern (preview mode):**
```typescript
// 1. Scrape without saving
const res = await fetch("/scrape/", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ keywords, location, sites, auto_save: false }),
})
const { results } = await res.json()
// Show results table — user selects which ones to save

// 2. Save selected job
await fetch("/jobs/", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ ...selectedJob, status: "pending" }),
})
```

---

## Phase 8 — Optional: AI Qualification Scoring

After Phase 6 is stable, port `QualificationAnalyzer` from JobOS into job-tracker as a service:

```
backend/app/services/
└── ai_scorer.py          ← port of JobOS qualification_analyzer.py (google.genai)
```

Add a `score: Optional[int]` field to `JobResponse`.
In `scraper_service.py`, after scraping, call the AI scorer on each job description and attach the score before returning.

---

## Implementation Order

| # | What | Files touched | Blocking? |
|---|------|---------------|-----------|
| 1 | Install deps | `requirements.txt` | Yes — must be first |
| 2 | DB migration | `migrations/002_add_scraper_fields.sql` | Yes — before any inserts |
| 3 | Extend Job model | `app/models/jobs.py` | Yes |
| 4 | Extend schemas | `app/schemas/jobs.py`, new `app/schemas/scraper.py` | Yes |
| 5 | Scraper service | new `app/services/scraper_service.py` | Yes |
| 6 | Scraper route | new `app/routes/scraper.py`, `main.py` | Yes |
| 7 | Frontend page | `frontend/app/scraper/page.tsx` | No — backend works standalone |
| 8 | AI scoring | new `app/services/ai_scorer.py` | No — optional enhancement |

---

## Testing Each Phase

```bash
# Phase 5-6: hit the endpoint directly
curl -X POST http://localhost:8000/scrape/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "software engineer",
    "location": "New York, NY",
    "sites": ["linkedin", "indeed"],
    "results_per_site": 5,
    "hours_old": 72,
    "auto_save": false
  }'
```

Expected response shape:
```json
{
  "success": true,
  "total_found": 10,
  "saved_count": 0,
  "results": [
    {
      "id": -1,
      "company": "Acme Corp",
      "role": "Software Engineer",
      "source": "linkedin",
      "source_url": "https://linkedin.com/jobs/view/...",
      ...
    }
  ],
  "errors": []
}
```

---

## Notes & Gotchas

- **`python-jobspy` rate limits**: Add `country_indeed="USA"` param if scraping Indeed outside US.
- **LinkedIn login not required**: jobspy scrapes LinkedIn's public job listings without credentials.
- **DataFrame NaN values**: Always use `pd.notna()` before accessing row values — jobspy columns can be NaN.
- **description truncation**: Descriptions can be very long. The `[:5000]` slice in `_row_to_job` prevents hitting Supabase column limits.
- **Duplicate prevention**: Consider adding a `UNIQUE(user_id, source_url)` constraint to the `jobs` table to prevent re-importing the same posting.
- **jobspy blocks**: If LinkedIn blocks requests, use the `proxy` param in `scrape_jobs()` or add `ca_cert` for corporate proxies.
