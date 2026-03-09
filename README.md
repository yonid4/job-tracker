# Job Tracker

A full-stack app for tracking job applications. Includes a built-in job scraper powered by [JobSpy](https://github.com/Bunsly/JobSpy) that searches LinkedIn, Indeed, Glassdoor, and other job boards — letting you import listings directly into your tracker without manual data entry.

## Tech Stack

- **Frontend:** Next.js, shadcn/ui
- **Backend:** Python, FastAPI
- **Database:** Supabase (PostgreSQL)
- **Scraper:** JobSpy

## Project Structure

```
job-tracker/
├── backend/
│   ├── app/
│   │   ├── models/        # Pydantic database models
│   │   │   ├── jobs.py
│   │   │   ├── scraper.py
│   │   │   └── users.py
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   │   ├── auth.py
│   │   │   ├── jobs.py
│   │   │   ├── scraper.py
│   │   │   └── user.py
│   │   ├── routes/        # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── jobs.py
│   │   │   └── scraper.py
│   │   ├── services/      # Business logic layer
│   │   │   └── scraper_service.py
│   │   └── utils/         # Utility functions (auth, security)
│   ├── main.py
│   └── requirements.txt
├── migrations/            # SQL migration files
└── frontend/
    ├── app/
    │   ├── (auth)/        # Login and register pages
    │   ├── (dashboard)/
    │   │   ├── dashboard/ # Job tracker table + actions
    │   │   └── scraper/   # Scraper UI + actions
    │   └── layout.tsx
    └── components/
        ├── dashboard/     # Table, toolbar, modals, stats
        ├── ui/            # shadcn/ui primitives
        ├── Sidebar.tsx
        └── StatusBadge.tsx
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Supabase project

### Environment Variables

Create a `.env` file inside the `backend/` directory:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
SECRET_KEY=your_jwt_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Database

Run the migration files in order against your Supabase project via the SQL editor:

```
migrations/001_create_users_table.sql
migrations/002_create_jobs_table.sql
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
fastapi dev main.py
```

API docs available at `http://localhost:8000/docs`

### Frontend

```bash
npm install
npx shadcn@latest init
npm run dev
```

Open `http://localhost:3000` to view the app.
