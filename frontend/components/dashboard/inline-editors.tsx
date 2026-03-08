"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "@/components/StatusBadge";
import { JobStatus } from "@/types";
import { STATUS_OPTIONS } from "./constants";

// ---------------------------------------------------------------------------
// InlineStatus
// ---------------------------------------------------------------------------

interface InlineStatusProps {
  value: JobStatus;
  onSave: (v: JobStatus) => void;
}

export function InlineStatus({ value, onSave }: InlineStatusProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center bg-muted hover:bg-accent border border-border rounded-full px-2.5 py-0.5 transition-colors">
          <StatusBadge status={value} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {STATUS_OPTIONS.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => onSave(s)}
            className="text-sm gap-2"
          >
            <StatusBadge status={s} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
