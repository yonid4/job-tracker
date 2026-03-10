// Shared TypeScript types (Job, User, etc.) go here

export type JobStatus = "Applied" | "Interviewing" | "Offer" | "Rejected";

export interface Job {
  id: string;
  company: string;
  role: string;
  description: string;
  salary: string;
  link: string;
  status: JobStatus;
  dateSubmitted: string;
}

export interface ScrapedJob {
  id: number;
  company: string;
  role: string;
  description: string | null;
  salary: string | null;
  link: string | null;
  status: string;
  source: string;
  source_url: string | null;
  scraped_at: string | null;
  job_level: string | null;
}
