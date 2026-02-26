# Standard library
from typing import Optional
from datetime import date

# Third-party
from fastapi import APIRouter, Depends, HTTPException, status

# Local
from app.database import supabase
from app.models.jobs import Job
from app.routes.auth import get_current_me
from app.schemas.jobs import JobResponse, JobCreate, supabase_job_to_response
from app.schemas.user import UserResponse

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/", response_model=JobResponse)
async def create_job(
    job_create: JobCreate,
    user: UserResponse = Depends(get_current_me),
):
    job = Job(
        user_id=user.id,
        company=job_create.company,
        role=job_create.role,
        description=job_create.description,
        salary=job_create.salary,
        link=job_create.link,
        status=job_create.status,
        date_submitted=job_create.date_submitted,
    )

    job = supabase.table("jobs").insert(job.model_dump(exclude_none=True)).execute()
    return supabase_job_to_response(job.data[0])

@router.delete("/{job_id}")
async def delete_job(job_id: int, user: UserResponse = Depends(get_current_me)):
    job = supabase.table("jobs").select("*").eq("id", job_id).execute()
    if not job.data or job.data[0]["user_id"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Failed to delete job"
        )

    supabase.table("jobs").delete().eq("id", job_id).execute()
    return {"message": "Job deleted successfully"}

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: int):
    job = supabase.table("jobs").select("*").eq("id", job_id).execute()

    if not job.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    return supabase_job_to_response(job.data[0])

@router.patch("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_create: JobCreate,
    user: UserResponse = Depends(get_current_me),
):
    job = supabase.table("jobs").select("*").eq("id", job_id).execute()
    if not job.data or job.data[0]["user_id"] != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    job = supabase.table("jobs").update({
        "company": job_create.company,
        "role": job_create.role,
        "description": job_create.description,
        "salary": job_create.salary,
        "link": job_create.link,
        "status": job_create.status,
        "date_submitted": job_create.date_submitted.isoformat() if job_create.date_submitted else None,
    }).eq("id", job_id).eq("user_id", user.id).execute()

    return supabase_job_to_response(job.data[0])