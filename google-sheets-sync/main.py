import scraper
import sheets
from config import Config as config


def main() -> None:
    print(f"Scraping: {config.SEARCH_TERM} in {config.LOCATION} across {config.SITE_NAMES}\n")

    jobs, errors = scraper.run_scrape()

    for err in errors:
        print(f"[error] {err}")

    if not jobs:
        print("No jobs returned from scraper.")
        return

    existing_links = sheets.get_existing_links()
    new_jobs = [j for j in jobs if j.link not in existing_links]
    duplicates = len(jobs) - len(new_jobs)

    if not new_jobs:
        print(f"No new jobs found ({duplicates} duplicates skipped).")
        return

    # Post-filter by experience level (LinkedIn only — others always pass through)
    if config.EXPERIENCE_LEVEL:
        new_jobs = [
            j for j in new_jobs
            if j.job_level is None or j.job_level.lower() == config.EXPERIENCE_LEVEL.lower()
        ]

    new_jobs = new_jobs[:config.RESULTS_WANTED]

    sheets.append_jobs(new_jobs)
    print(f"Done: {len(new_jobs)} new jobs added, {duplicates} duplicates skipped.")


if __name__ == "__main__":
    main()
