"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DescriptionModalProps {
  value: string;
  anchor: { top: number; left: number; width: number };
  onSave: (newValue: string) => void;
  onClose: () => void;
}

export function DescriptionModal({ value, anchor, onSave, onClose }: DescriptionModalProps) {
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [draft]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSave() {
    onSave(draft);
    onClose();
  }

  const minWidth = Math.max(anchor.width * 3, 320);
  const safeLeft = Math.min(anchor.left, window.innerWidth - minWidth - 8);
  const maxHeight = window.innerHeight - anchor.top - 16;

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      <div
        className="absolute bg-background border border-border rounded shadow-xl p-3 flex flex-col gap-3 overflow-hidden"
        style={{
          top: anchor.top,
          left: safeLeft,
          minWidth,
          maxWidth: "min(560px, calc(100vw - 16px))",
          maxHeight,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={6}
          className="resize-none overflow-y-auto"
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}
