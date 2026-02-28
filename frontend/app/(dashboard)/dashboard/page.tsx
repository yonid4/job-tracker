"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Job, JobStatus } from "@/types";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { JobToolbar } from "@/components/dashboard/JobToolbar";
import { JobsTable } from "@/components/dashboard/JobsTable";

// ---------------------------------------------------------------------------
// Mock data (temporary — replace with API calls)
// ---------------------------------------------------------------------------

const MOCK_JOBS: Job[] = [
  {
    id: "1",
    company: "Stripe",
    role: "Software Engineer",
    description:
      "Work on the core payments infrastructure. Responsibilities include designing scalable APIs, improving reliability of the billing engine, and collaborating with product teams to ship new financial products.\n\nRequired: 4+ years backend experience, strong distributed systems knowledge.",
    salary: "$160,000",
    link: "https://stripe.com/jobs/1",
    status: "Interviewing",
    dateSubmitted: "2026-02-10",
  },
  {
    id: "2",
    company: "Linear",
    role: "Frontend Engineer",
    description:
      "Build the next generation of project management tooling. You'll own major surface areas of the web app, work closely with design, and care deeply about performance and UX polish.",
    salary: "$140,000",
    link: "https://linear.app/jobs/2",
    status: "Applied",
    dateSubmitted: "2026-02-14",
  },
  {
    id: "3",
    company: "Vercel",
    role: "Product Engineer",
    description:
      "Join the DX team. Ship features that improve the developer experience across the Vercel platform — from the dashboard to CLI integrations. Close collaboration with infra and design.",
    salary: "$150,000",
    link: "https://vercel.com/careers/3",
    status: "Offer",
    dateSubmitted: "2026-01-28",
  },
  {
    id: "4",
    company: "Notion",
    role: "Full Stack Engineer",
    description:
      "Own end-to-end features for the Notion editor and API. Work in a fast-moving environment where you'll regularly ship to millions of users.",
    salary: "$135,000",
    link: "https://notion.so/jobs/4",
    status: "Rejected",
    dateSubmitted: "2026-01-20",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<JobStatus | "All">("All");
  const [addingRow, setAddingRow] = useState(false);

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchSearch =
      j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q);
    const matchFilter = filter === "All" || j.status === filter;
    return matchSearch && matchFilter;
  });

  function handleAdd(job: Omit<Job, "id">) {
    setJobs((prev) => [{ ...job, id: crypto.randomUUID() }, ...prev]);
    setAddingRow(false);
  }

  function handleDelete(id: string) {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  function updateJob(id: string, patch: Partial<Job>) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }

  const stats = {
    total: jobs.length,
    applied: jobs.filter((j) => j.status === "Applied").length,
    interviews: jobs.filter((j) => j.status === "Interviewing").length,
    offers: jobs.filter((j) => j.status === "Offer").length,
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Top bar */}
      <div className="h-14 border-b border-border flex items-center px-12 shrink-0">
        <span className="text-xs text-muted-foreground">
          {format(new Date(), "MMMM yyyy")}
        </span>
      </div>

      <div className="px-12 py-10 flex flex-col gap-8 flex-1">
        <DashboardGreeting interviewCount={stats.interviews} />

        <StatsRow
          total={stats.total}
          applied={stats.applied}
          interviews={stats.interviews}
          offers={stats.offers}
        />

        <JobToolbar
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          onAddJob={() => setAddingRow(true)}
          addingRow={addingRow}
        />

        <JobsTable
          jobs={filtered}
          addingRow={addingRow}
          onAdd={handleAdd}
          onCancelAdd={() => setAddingRow(false)}
          onUpdate={updateJob}
          onDelete={handleDelete}
        />

        <p className="text-xs text-muted-foreground">
          {filtered.length} job{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
