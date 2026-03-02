import { apiFetch } from "@/lib/api";
import { Job } from "@/types";
import { DashboardContent } from "./DashboardContent";

export default async function DashboardPage() {
  const res = await apiFetch("/jobs/");
  const raw: Record<string, unknown>[] = res.ok ? await res.json() : [];

  const jobs: Job[] = raw.map((j) => ({
    id: String(j.id),
    company: (j.company as string) ?? "",
    role: (j.role as string) ?? "",
    description: (j.description as string) ?? "",
    salary: (j.salary as string) ?? "",
    link: (j.link as string) ?? "",
    status: j.status as Job["status"],
    dateSubmitted: (j.date_submitted as string) ?? "",
  }));

  return <DashboardContent initialJobs={jobs} />;
}
