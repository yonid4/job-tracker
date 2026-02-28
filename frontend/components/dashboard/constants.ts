import { JobStatus } from "@/types";

export const STATUS_OPTIONS: JobStatus[] = [
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
];

export const STATUS_FILTERS: (JobStatus | "All")[] = [
  "All",
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
];
