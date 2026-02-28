import { JobStatus } from "@/types";

const DOT_COLOR: Record<JobStatus, string> = {
  Applied: "bg-blue-500",
  Interviewing: "bg-yellow-400",
  Offer: "bg-green-500",
  Rejected: "bg-red-400",
};

interface StatusBadgeProps {
  status: JobStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className="flex items-center gap-1.5 text-sm">
      <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_COLOR[status]}`} />
      {status}
    </span>
  );
}
