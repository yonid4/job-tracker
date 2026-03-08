"use client";

import { useState, useRef } from "react";
import Handsontable from "handsontable";
import { HotTable } from "@handsontable/react";
import type { HotTableClass } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import { Job } from "@/types";
import { NewRow } from "./NewRow";
import { STATUS_OPTIONS, STATUS_DOT_COLORS } from "./constants";
import { DescriptionModal } from "./DescriptionModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

registerAllModules();

// ---------------------------------------------------------------------------
// Custom renderers
// ---------------------------------------------------------------------------

const statusRenderer: Handsontable.renderers.BaseRenderer = function (
  _instance, td, _row, _col, _prop, value
) {
  td.innerHTML = "";
  td.style.padding = "4px 6px";
  td.style.verticalAlign = "middle";
  td.style.textAlign = "center";

  if (value) {
    const dotColor = STATUS_DOT_COLORS[value as keyof typeof STATUS_DOT_COLORS] ?? "#9ca3af";
    const badge = document.createElement("span");
    badge.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px 3px 8px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 500;
      background: #ffffff;
      color: #111827;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
      white-space: nowrap;
    `;
    const dot = document.createElement("span");
    dot.style.cssText = `
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${dotColor};
      flex-shrink: 0;
    `;
    const text = document.createElement("span");
    text.textContent = value as string;
    badge.appendChild(dot);
    badge.appendChild(text);
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

  const hotRef = useRef<HotTableClass>(null);

  function handleAfterOnCellMouseDown(event: MouseEvent, coords: { row: number; col: number }) {
    if (coords.row < 0) return;
    const td = event.target as HTMLElement;
    const rect = td.getBoundingClientRect();

    if (coords.col === 5) {
      setStatusPopover({
        rowIndex: coords.row,
        anchor: { top: rect.bottom, left: rect.left, width: rect.width },
      });
    }
  }

  function handleContainerDblClick(e: React.MouseEvent) {
    const td = (e.target as HTMLElement).closest("td");
    if (!td) return;
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;
    const coords = hot.getCoords(td as HTMLTableCellElement);
    if (!coords || coords.row < 0 || coords.col !== 2) return;
    const rect = td.getBoundingClientRect();
    const job = jobs[coords.row];
    if (!job) return;
    setDescModal({
      rowIndex: coords.row,
      value: job.description ?? "",
      anchor: { top: rect.top, left: rect.left, width: rect.width },
    });
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
        <div onDoubleClick={handleContainerDblClick}>
        <HotTable
          ref={hotRef}
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
        </div>
      )}

      {descModal && (
        <DescriptionModal
          value={descModal.value}
          anchor={descModal.anchor}
          onSave={handleDescSave}
          onClose={() => setDescModal(null)}
        />
      )}

      <DropdownMenu
        open={!!statusPopover}
        onOpenChange={(open) => { if (!open) setStatusPopover(null); }}
      >
        <DropdownMenuTrigger asChild>
          <div
            className="fixed pointer-events-none"
            style={
              statusPopover
                ? { top: statusPopover.anchor.top, left: statusPopover.anchor.left, width: statusPopover.anchor.width, height: 0 }
                : { top: 0, left: 0, width: 0, height: 0 }
            }
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" style={{ minWidth: statusPopover?.anchor.width }}>
          {STATUS_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option}
              onClick={() => handleStatusSelect(option)}
              className="gap-2 text-sm"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: STATUS_DOT_COLORS[option] ?? "#9ca3af" }}
              />
              {option}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
