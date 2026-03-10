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
    print("Scraping starting")
    print("request:")
    print(f"keyword:{request.keywords}")
    print(f"location:{request.location}")
    print(f"sites:{request.sites}")
    print(f"results per site:{request.results_per_site}")
    print(f"hours old:{request.hours_old}")
    print(f"job type:{request.job_type}")
    print(f"experience level:{request.experience_level}")
    print(f"auto save:{request.auto_save}")
    print()
    results, errors = await run_scrape(request, user_id=user.id)

    print(f"errors:{errors}")

    return ScrapeResponse(
        success=len(errors) == 0 or len(results) > 0,
        total_found=len(results),
        saved_count=len(results) if request.auto_save else 0,
        results=results,
        errors=errors,
    )