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
