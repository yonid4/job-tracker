"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 h-full border-r border-gray-200 bg-white flex flex-col">
      <div className="px-6 py-6">
        <span className="text-[#1E3A5F] font-semibold text-lg tracking-tight">
          JobTracker
        </span>
      </div>

      <nav className="flex-1 px-3">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors mb-1",
                isActive
                  ? "text-[#1E3A5F] font-medium border-l-2 border-[#1E3A5F] bg-[#1E3A5F]/5 pl-[10px]"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
