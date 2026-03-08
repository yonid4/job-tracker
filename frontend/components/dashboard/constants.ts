import { JobStatus } from "@/types";

export const STATUS_DOT_COLORS: Record<JobStatus, string> = {
  Applied:      "#3b82f6",
  Interviewing: "#f59e0b",
  Offer:        "#10b981",
  Rejected:     "#ef4444",
};

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
