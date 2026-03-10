"use server";

import { apiFetch } from "@/lib/api";
import { ScrapedJob } from "@/types";

export type ScrapeParams = {
  keywords: string;
  location: string;
  sites: string[];
  results_per_site: number;
  is_remote?: boolean;
  job_type?: string;
  experience_level?: string;
  hours_old?: number;
  distance?: number;
};

export type ScrapeResult = {
  jobs?: ScrapedJob[];
  errors?: string[];
  error?: string;
};

export async function scrapeJobsAction(params: ScrapeParams): Promise<ScrapeResult> {
  const res = await apiFetch("/scrape/", {
    method: "POST",
    body: JSON.stringify({ ...params, auto_save: false }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { error: data.detail ?? "Scrape failed" };
  }

  return { jobs: data.results, errors: data.errors };
}

export async function saveScrapedJobAction(job: ScrapedJob): Promise<{ error?: string }> {
  const res = await apiFetch("/jobs/", {
    method: "POST",
    body: JSON.stringify({
      company: job.company,
      role: job.role,
      description: job.description || null,
      salary: job.salary || null,
      link: job.link || null,
      status: "pending",
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    return { error: data.detail ?? "Failed to save job" };
  }

  return {};
}
