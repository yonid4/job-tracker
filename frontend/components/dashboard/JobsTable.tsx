"use client";

import { useState } from "react";
import Handsontable from "handsontable";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import { Job } from "@/types";
import { NewRow } from "./NewRow";
import { STATUS_OPTIONS } from "./constants";
import { DescriptionModal } from "./DescriptionModal";

registerAllModules();

// ---------------------------------------------------------------------------
// Custom renderers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Applied:      { bg: "#dbeafe", color: "#1e40af" },
  Interviewing: { bg: "#fef3c7", color: "#92400e" },
  Offer:        { bg: "#d1fae5", color: "#065f46" },
  Rejected:     { bg: "#fee2e2", color: "#991b1b" },
};

const statusRenderer: Handsontable.renderers.BaseRenderer = function (
  _instance, td, _row, _col, _prop, value
) {
  td.innerHTML = "";
  td.style.padding = "4px 6px";
  td.style.verticalAlign = "middle";

  if (value) {
    const scheme = STATUS_COLORS[value as string] ?? { bg: "#f3f4f6", color: "#374151" };
    const badge = document.createElement("span");
    badge.textContent = value as string;
    badge.style.cssText = `
      display: inline-block;
      padding: 2px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      background: ${scheme.bg};
      color: ${scheme.color};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    `;
    td.appendChild(badge);
  }
};

const linkRenderer: Handsontable.renderers.BaseRenderer = function (
  instance, td, row, col, prop, value, cellProperties
) {
  Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, cellProperties);
  const url = value as string;
  if (url) {
    const a = document.createElement("a");
    a.href = url;
    a.textContent = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.cssText =
      "color: inherit; text-decoration: underline; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
    td.innerHTML = "";
    td.appendChild(a);
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
  const [descModal, setDescModal] = useState<{
    rowIndex: number;
    value: string;
    anchor: { top: number; left: number; width: number };
  } | null>(null);

  const [statusPopover, setStatusPopover] = useState<{
    rowIndex: number;
    anchor: { top: number; left: number; width: number };
  } | null>(null);

  function handleAfterOnCellMouseDown(event: MouseEvent, coords: { row: number; col: number }) {
    if (coords.row < 0) return;
    const td = event.target as HTMLElement;
    const rect = td.getBoundingClientRect();

    if (coords.col === 2) {
      const job = jobs[coords.row];
      if (!job) return;
      setDescModal({
        rowIndex: coords.row,
        value: job.description ?? "",
        anchor: { top: rect.top, left: rect.left, width: rect.width },
      });
    }

    if (coords.col === 5) {
      setStatusPopover({
        rowIndex: coords.row,
        anchor: { top: rect.bottom, left: rect.left, width: rect.width },
      });
    }
  }

  function handleStatusSelect(value: string) {
    if (!statusPopover) return;
    const job = jobs[statusPopover.rowIndex];
    if (job) onUpdate(job.id, { status: value as Job["status"] });
    setStatusPopover(null);
  }

  function handleDescSave(newValue: string) {
    if (!descModal) return;
    const job = jobs[descModal.rowIndex];
    if (job) onUpdate(job.id, { description: newValue });
    setDescModal(null);
  }

  function handleAfterChange(
    changes: Handsontable.CellChange[] | null,
    source: Handsontable.ChangeSource
  ) {
    if (!changes || source === "loadData") return;
    for (const [row, prop, , newVal] of changes) {
      const job = jobs[row as number];
      if (!job) continue;
      onUpdate(job.id, { [prop as string]: newVal });
    }
  }

  function handleBeforeRemoveRow(index: number, amount: number) {
    for (let i = 0; i < amount; i++) {
      const job = jobs[index + i];
      if (job) onDelete(job.id);
    }
  }

  return (
    <div className="border border-border rounded">
      {addingRow && (
        <table className="w-full">
          <tbody>
            <NewRow onConfirm={onAdd} onCancel={onCancelAdd} />
          </tbody>
        </table>
      )}

      {jobs.length === 0 && !addingRow ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No jobs found. Add one to get started.
        </div>
      ) : (
        <HotTable
          data={jobs}
          licenseKey="non-commercial-and-evaluation"
          colHeaders={[
            "Company",
            "Role",
            "Description",
            "Salary",
            "Link",
            "Status",
            "Date Submitted",
          ]}
          columns={[
            { data: "company",       type: "text" },
            { data: "role",          type: "text" },
            { data: "description",   type: "text", readOnly: true },
            { data: "salary",        type: "text" },
            { data: "link",          type: "text", renderer: linkRenderer },
            { data: "status",        type: "text", readOnly: true, renderer: statusRenderer },
            { data: "dateSubmitted", type: "date", dateFormat: "YYYY-MM-DD" },
          ]}
          rowHeights={32}
          colWidths={[150, 150, 200, 100, 200, 150, 150]}
          rowHeaders={false}
          stretchH="all"
          wordWrap={false}
          contextMenu={["remove_row"]}
          afterChange={handleAfterChange}
          afterOnCellMouseDown={handleAfterOnCellMouseDown}
          beforeRemoveRow={handleBeforeRemoveRow}
          height="auto"
          width="100%"
        />
      )}

      {descModal && (
        <DescriptionModal
          value={descModal.value}
          anchor={descModal.anchor}
          onSave={handleDescSave}
          onClose={() => setDescModal(null)}
        />
      )}

      {statusPopover && (
        <div className="fixed inset-0 z-50" onClick={() => setStatusPopover(null)}>
          <div
            className="absolute bg-background border border-border rounded shadow-xl py-1"
            style={{
              top: statusPopover.anchor.top,
              left: statusPopover.anchor.left,
              minWidth: statusPopover.anchor.width,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleStatusSelect(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
