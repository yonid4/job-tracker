# Job Tracker

A full-stack app for tracking job applications.

## Tech Stack

- **Frontend:** Next.js
- **Backend:** Python, FastAPI
- **Database:** Supabase (PostgreSQL)

## Project Structure

```
job-tracker/
├── backend/
│   ├── app/
│   │   ├── models/        # Pydantic database models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── routes/        # API route handlers
│   │   └── utils/         # Utility functions (auth, security)
│   ├── main.py
│   └── requirements.txt
├── migrations/            # SQL migration files
└── frontend/              # Next.js app
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
npm run dev
```

Open `http://localhost:3000` to view the app.
