# Google Sheets Sync — Implementation Plan

## What This Is

A standalone Python script that:
1. Calls python-jobspy directly with hardcoded search parameters
2. Deduplicates results against links already in the Google Sheet
3. Appends new jobs as rows to the sheet

No FastAPI, no Next.js, no Supabase. Run it from the terminal whenever you want fresh jobs.

---

## Folder Structure

```
google-sheets-sync/
├── config.py                  # All search parameters and sheet settings
├── scraper.py                 # Calls python-jobspy, returns job list
├── sheets.py                  # Google Sheets read/write logic
├── main.py                    # Entry point — orchestrates everything
├── requirements.txt           # Dependencies
├── .env                       # GOOGLE_SHEET_ID + credentials path (gitignored)
└── credentials/
    └── google-sheets.json     # Service account key (gitignored)
```

---

## `config.py`

All python-jobspy parameters live here. Change these before running.

```python
# --- Search ---
SEARCH_TERM = "software engineer"
LOCATION = "San Francisco, CA"
RESULTS_WANTED = 50         # per site
HOURS_OLD = 72              # only jobs posted in the last N hours (None = no limit)
DISTANCE = 50               # miles

# --- Sites ---
# Options: "linkedin", "indeed", "glassdoor", "zip_recruiter", "google"
SITE_NAMES = ["linkedin", "indeed", "glassdoor", "zip_recruiter"]

# --- Filters ---
IS_REMOTE = False
# Options: "fulltime", "parttime", "internship", "contract" (None = all)
JOB_TYPE = None
# Options: "internship", "entry level", "associate", "mid-senior level", "director", "executive" (None = all)
# Note: only LinkedIn populates this field — other sites always pass through
EXPERIENCE_LEVEL = None

# --- LinkedIn specific ---
# Fetches full description and direct job URL from LinkedIn (slower)
LINKEDIN_FETCH_DESCRIPTION = True

# --- Google Sheet ---
# Column order must match your Google Sheet exactly
SHEET_TAB_NAME = "Tracking Template"
STATUS_ON_SCRAPE = "Have Not Applied"
```

---

## `sheets.py`

Handles two things:
1. **Read** — fetch all existing links from the "Link to Job Req" column to build the dedup set
2. **Write** — append new job rows

Authentication uses a service account JSON key. The sheet must be shared with the service account email (Editor access).

**Row format written to sheet:**

| Company Name | Application Status | Role | Salary | Date Submitted | Link to Job Req | Rejection Reason | Notes |
|---|---|---|---|---|---|---|---|
| `company` | `"Have Not Applied"` | `title\n\ndescription` | `salary` | _(empty)_ | `job_url` | _(empty)_ | _(empty)_ |

> Role column combines title and description in one cell separated by two line breaks, matching the existing sheet format. This can be split into two separate columns by changing the column order in `config.py` — no logic changes needed.

---

## `scraper.py`

Thin wrapper around `jobspy.scrape_jobs()`. Takes values from `config.py`, runs the scrape, and returns a list of dicts with only the fields needed for the sheet:

```
company, title, description, salary, job_url, job_level, site
```

Handles:
- Experience level post-filter (since jobspy has no native filter — LinkedIn only, others always pass through)
- Salary formatting from `min_amount`/`max_amount` integers → `"$X,000 - $Y,000"`
- Null-safe field access

---

## `main.py`

Entry point. Runs in order:

```
1. Load config
2. Call scraper.py → get raw job list
3. Call sheets.py → get existing links from "Link to Job Req" column
4. Filter: remove any job whose link already exists in the sheet
5. If nothing new: print "No new jobs found" and exit
6. Call sheets.py → append new rows
7. Print summary: X new jobs added, Y duplicates skipped
```

---

## Google Cloud Setup (one-time, manual)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → enable **Google Sheets API**
3. IAM & Admin → Service Accounts → Create → download **JSON key**
4. Save key to `google-sheets-sync/credentials/google-sheets.json`
5. Share your Google Sheet with the service account email (found in the JSON as `client_email`) — give it **Editor** access
6. Copy your **Sheet ID** from the URL:
   `docs.google.com/spreadsheets/d/`**`<THIS_PART>`**`/edit`
7. Add to `google-sheets-sync/.env`:
   ```
   GOOGLE_SHEET_ID=your_sheet_id_here
   GOOGLE_CREDENTIALS_PATH=credentials/google-sheets.json
   ```

---

## `requirements.txt`

```
python-jobspy
google-auth
google-api-python-client
python-dotenv
pandas
```

---

## How to Run

```bash
cd google-sheets-sync
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Edit config.py with your search params, then:
python main.py
```

---

## Application Status Options

These are the exact values from the Google Sheet dropdown. The script uses `"Have Not Applied"` for all scraped jobs:

- Have Not Applied
- Submitted - Pending Response
- Rejected
- Interviewing
- Offer Extended - In Progress
- Job Rec Removed/Deactivated
- Ghosted
- Offer Extended - Did Not Accept
- Re-Applied With Updated Resume
- Rescinded Application (Self) / Decided not a good fit
- Not For Me
- Sent Follow Up Email
- N/A
- OA

---

## Deduplication Logic

Before writing, the script reads every value in the **"Link to Job Req"** column and builds a set of known URLs. Any scraped job whose `job_url` is in that set is skipped. This means:

- Running the same search twice won't add duplicate rows
- Jobs you manually added to the sheet with a link are also protected

**Edge case:** jobs with no URL (rare) are always written — there's no other reliable dedup key for them.

---

## Out of Scope (Future)

- **Qualification service:** upload your resume → Gemini API scores each job description → only jobs above a threshold score get written to the sheet
