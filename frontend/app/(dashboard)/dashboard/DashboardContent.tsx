"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Job, JobStatus } from "@/types";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { JobToolbar } from "@/components/dashboard/JobToolbar";
import { JobsTable } from "@/components/dashboard/JobsTable";
import { createJobAction, deleteJobAction, updateJobAction } from "./actions";

export function DashboardContent({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
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

  async function handleAdd(job: Omit<Job, "id">) {
    const result = await createJobAction(job);
    if (result.job) {
      setJobs((prev) => [result.job!, ...prev]);
      setAddingRow(false);
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteJobAction(id);
    if (!result.error) {
      setJobs((prev) => prev.filter((j) => j.id !== id));
    }
  }

  async function updateJob(id: string, patch: Partial<Job>) {
    const current = jobs.find((j) => j.id === id);
    if (!current) return;
    const updated = { ...current, ...patch };
    const result = await updateJobAction(updated);
    if (!result.error) {
      setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
    }
  }

  const stats = {
    total: jobs.length,
    applied: jobs.filter((j) => j.status === "Applied").length,
    interviews: jobs.filter((j) => j.status === "Interviewing").length,
    offers: jobs.filter((j) => j.status === "Offer").length,
  };

  return (
    <div className="flex flex-col min-h-full">
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
