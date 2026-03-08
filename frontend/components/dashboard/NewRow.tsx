"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Job } from "@/types";
import { InlineStatus } from "./inline-editors";

function emptyDraft(): Omit<Job, "id"> {
  return {
    company: "",
    role: "",
    description: "",
    salary: "",
    link: "",
    status: "Applied",
    dateSubmitted: new Date().toISOString().split("T")[0],
  };
}

interface NewRowProps {
  onConfirm: (job: Omit<Job, "id">) => void;
  onCancel: () => void;
}

export function NewRow({ onConfirm, onCancel }: NewRowProps) {
  const [form, setForm] = useState<Omit<Job, "id">>(emptyDraft());
  const [dateOpen, setDateOpen] = useState(false);

  function handleConfirm() {
    if (!form.company.trim() && !form.role.trim()) {
      onCancel();
      return;
    }
    onConfirm(form);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") onCancel();
  }

  function set<K extends keyof Omit<Job, "id">>(field: K, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <tr className="border-b border-border bg-accent/20">
      <td className="px-4 py-2.5">
        <Input
          autoFocus
          placeholder="Company"
          value={form.company}
          onChange={(e) => set("company", e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm"
        />
      </td>
      <td className="px-4 py-2.5">
        <Input
          placeholder="Role"
          value={form.role}
          onChange={(e) => set("role", e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm"
        />
      </td>
      <td className="px-4 py-2.5">
        <Input
          placeholder="Description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm"
        />
      </td>
      <td className="px-4 py-2.5">
        <Input
          placeholder="$0,000"
          value={form.salary}
          onChange={(e) => set("salary", e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm"
        />
      </td>
      <td className="px-4 py-2.5">
        <Input
          placeholder="https://…"
          value={form.link}
          onChange={(e) => set("link", e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm"
        />
      </td>
      <td className="px-4 py-2.5">
        <InlineStatus value={form.status} onSave={(v) => set("status", v)} />
      </td>
      <td className="px-4 py-2.5">
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <span className="cursor-pointer hover:bg-accent/50 rounded px-1 py-0.5 text-sm text-muted-foreground">
              {form.dateSubmitted
                ? format(parseISO(form.dateSubmitted), "MMM d, yyyy")
                : "—"}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={
                form.dateSubmitted ? parseISO(form.dateSubmitted) : undefined
              }
              onSelect={(d) => {
                if (d) {
                  set("dateSubmitted", format(d, "yyyy-MM-dd"));
                  setDateOpen(false);
                }
              }}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-0.5">
          <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleConfirm}>
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onCancel}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
