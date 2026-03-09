"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Settings, LogOut, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/(auth)/actions";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scraper", label: "Import Jobs", icon: Search },
  // { href: "/jobs", label: "Jobs", icon: Briefcase },
  // { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 h-full border-r border-border bg-background flex flex-col">
      <div className="px-6 py-6">
        <span className="text-primary font-semibold text-lg tracking-tight">
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
                  ? "text-primary font-medium border-l-2 border-primary bg-primary/5 pl-[10px]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => logoutAction()}
        >
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </aside>
  );
}
