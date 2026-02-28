"use client";

import { Trash2 } from "lucide-react";
import { Job } from "@/types";
import {
  InlineText,
  InlineTextarea,
  InlineDate,
  InlineStatus,
} from "./inline-editors";
import { NewRow } from "./NewRow";

interface JobRowProps {
  job: Job;
  onUpdate: (patch: Partial<Job>) => void;
  onDelete: () => void;
}

function JobRow({ job, onUpdate, onDelete }: JobRowProps) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-primary/[0.03] group transition-colors">
      <td className="px-4 py-3.5 text-sm font-medium text-foreground">
        <InlineText
          value={job.company}
          onSave={(v) => onUpdate({ company: v })}
        />
      </td>
      <td className="px-4 py-3.5 text-sm text-muted-foreground">
        <InlineText value={job.role} onSave={(v) => onUpdate({ role: v })} />
      </td>
      <td className="px-4 py-3.5 text-sm text-muted-foreground max-w-[200px]">
        <InlineTextarea
          value={job.description}
          onSave={(v) => onUpdate({ description: v })}
        />
      </td>
      <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
        <InlineText
          value={job.salary}
          onSave={(v) => onUpdate({ salary: v })}
        />
      </td>
      <td className="px-4 py-3.5 text-sm text-muted-foreground max-w-[140px]">
        <InlineText value={job.link} onSave={(v) => onUpdate({ link: v })} />
      </td>
      <td className="px-4 py-3.5">
        <InlineStatus
          value={job.status}
          onSave={(v) => onUpdate({ status: v })}
        />
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <InlineDate
          value={job.dateSubmitted}
          onSave={(v) => onUpdate({ dateSubmitted: v })}
        />
      </td>
      <td className="px-4 py-3.5">
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

interface JobsTableProps {
  jobs: Job[];
  addingRow: boolean;
  onAdd: (job: Omit<Job, "id">) => void;
  onCancelAdd: () => void;
  onUpdate: (id: string, patch: Partial<Job>) => void;
  onDelete: (id: string) => void;
}

export function JobsTable({
  jobs,
  addingRow,
  onAdd,
  onCancelAdd,
  onUpdate,
  onDelete,
}: JobsTableProps) {
  return (
    <div className="border border-border rounded">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {[
              "Company",
              "Role",
              "Description",
              "Salary",
              "Link",
              "Status",
              "Date Submitted",
            ].map((col) => (
              <th
                key={col}
                className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground"
              >
                {col}
              </th>
            ))}
            <th className="px-4 py-2.5 w-10" />
          </tr>
        </thead>
        <tbody>
          {addingRow && <NewRow onConfirm={onAdd} onCancel={onCancelAdd} />}

          {jobs.length === 0 && !addingRow ? (
            <tr>
              <td
                colSpan={8}
                className="text-center py-12 text-sm text-muted-foreground"
              >
                No jobs found. Add one to get started.
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                onUpdate={(patch) => onUpdate(job.id, patch)}
                onDelete={() => onDelete(job.id)}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
