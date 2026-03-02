"use server";

import { apiFetch } from "@/lib/api";
import { Job } from "@/types";

export async function createJobAction(
  job: Omit<Job, "id">
): Promise<{ job?: Job; error?: string }> {
  const res = await apiFetch("/jobs/", {
    method: "POST",
    body: JSON.stringify({
      company: job.company,
      role: job.role,
      description: job.description || null,
      salary: job.salary || null,
      link: job.link || null,
      status: job.status,
      date_submitted: job.dateSubmitted || null,
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    return { error: data.detail ?? "Failed to create job" };
  }

  const raw = await res.json();
  return {
    job: {
      id: String(raw.id),
      company: raw.company ?? "",
      role: raw.role ?? "",
      description: raw.description ?? "",
      salary: raw.salary ?? "",
      link: raw.link ?? "",
      status: raw.status,
      dateSubmitted: raw.date_submitted ?? "",
    },
  };
}

export async function deleteJobAction(
  id: string
): Promise<{ error?: string }> {
  const res = await apiFetch(`/jobs/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    return { error: data.detail ?? "Failed to delete job" };
  }
  return {};
}

export async function updateJobAction(
  job: Job
): Promise<{ error?: string }> {
  const res = await apiFetch(`/jobs/${job.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      company: job.company,
      role: job.role,
      description: job.description || null,
      salary: job.salary || null,
      link: job.link || null,
      status: job.status,
      date_submitted: job.dateSubmitted || null,
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    return { error: data.detail ?? "Failed to update job" };
  }
  return {};
}
