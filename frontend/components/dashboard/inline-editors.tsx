"use client";

import { useState, useRef, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
// InlineText
// ---------------------------------------------------------------------------

interface InlineTextProps {
  value: string;
  onSave: (v: string) => void;
  className?: string;
}

export function InlineText({ value, onSave, className }: InlineTextProps) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  if (editing) {
    function commit() {
      if (val.trim()) onSave(val.trim());
      setEditing(false);
    }
    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") {
        setVal(value);
        setEditing(false);
      }
    }
    return (
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={`bg-primary/10 border-2 border-primary rounded px-2 py-0.5 text-sm outline-none w-full ${className ?? ""}`}
      />
    );
  }

  return (
    <span
      onClick={() => {
        setVal(value);
        setEditing(true);
      }}
      className={`block line-clamp-1 cursor-default hover:bg-accent/30 rounded px-1 -mx-1 py-0.5 transition-colors ${className ?? ""}`}
    >
      {value || "—"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// InlineTextarea
// ---------------------------------------------------------------------------

interface InlineTextareaProps {
  value: string;
  onSave: (v: string) => void;
}

export function InlineTextarea({ value, onSave }: InlineTextareaProps) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.maxHeight = window.innerHeight - el.getBoundingClientRect().top - 15 + "px";
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [val, editing]);

  if (editing) {
    function commit() {
      onSave(val.trim());
      setEditing(false);
    }
    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
      if (e.key === "Escape") {
        setVal(value);
        setEditing(false);
      }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        commit();
      }
    }
    return (
      <div className="relative h-6">
        <textarea
          ref={textareaRef}
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="absolute top-0 left-0 z-10 min-w-[420px] bg-background border-2 border-primary rounded px-2 py-1 text-sm outline-none resize-none overflow-y-auto"
        />
      </div>
    );
  }

  return (
    <span
      onClick={() => {
        setVal(value);
        setEditing(true);
      }}
      className="line-clamp-1 cursor-default hover:bg-accent/30 rounded px-1 -mx-1 py-0.5 transition-colors"
    >
      {value.split("\n").find((line) => line.trim() !== "") || (
        <span className="text-muted-foreground/40">—</span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// InlineDate
// ---------------------------------------------------------------------------

interface InlineDateProps {
  value: string;
  onSave: (v: string) => void;
}

export function InlineDate({ value, onSave }: InlineDateProps) {
  const [open, setOpen] = useState(false);
  const date = value ? parseISO(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span className="cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 py-0.5 transition-colors text-sm text-muted-foreground">
          {date ? format(date, "MMM d, yyyy") : "—"}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) {
              onSave(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}

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
