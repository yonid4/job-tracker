import { JobStatus } from "@/types";
import { STATUS_DOT_COLORS } from "@/components/dashboard/constants";

interface StatusBadgeProps {
  status: JobStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className="flex items-center gap-1.5 text-sm">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: STATUS_DOT_COLORS[status] ?? "#9ca3af" }}
      />
      {status}
    </span>
  );
}
