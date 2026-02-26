# Third-party
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Local
from app.routes.auth import router as auth_router
from app.routes.jobs import router as jobs_router

# from app.routes.dashboard import router as dashboard_router

app = FastAPI(title="Job Tracker API", version="1.0.0")

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(jobs_router)

@app.get("/")
async def root():
    return {"message": "Welcome to the Job Tracker API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}
