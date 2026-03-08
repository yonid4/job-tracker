"use client";

import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JobStatus } from "@/types";
import { STATUS_FILTERS } from "./constants";

interface JobToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: JobStatus | "All";
  onFilterChange: (value: JobStatus | "All") => void;
  onAddJob: () => void;
  addingRow: boolean;
}

export function JobToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  onAddJob,
  addingRow,
}: JobToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative max-w-xs w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      <div className="flex items-center gap-1">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "ghost"}
            onClick={() => onFilterChange(f)}
            className="h-7 px-3 text-xs"
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="ml-auto">
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={onAddJob}
          disabled={addingRow}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Job
        </Button>
      </div>
    </div>
  );
}
