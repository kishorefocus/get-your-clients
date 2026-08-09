"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  KanbanSquare,
  Inbox,
  Phone,
  Users,
  BarChart3,
  Settings,
  Globe2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn } from "@/lib/motion";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/discovery", label: "Discovery", icon: Search },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/dashboard/inbox", label: "Inbox", icon: Inbox, badge: 4 },
  { href: "/dashboard/calls", label: "Calls", icon: Phone },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-background md:flex">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <motion.div
          className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Globe2 className="h-4 w-4" />
        </motion.div>
        <span className="font-display text-[17px] font-semibold tracking-tight">GlobalReach</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 scrollbar-thin">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Sliding active background — Framer Motion layoutId */}
              {active && (
                <motion.span
                  layoutId="sidebar-active-bg"
                  className="absolute inset-0 rounded-md bg-primary/10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              {/* Hover background for inactive items */}
              {!active && (
                <span className="absolute inset-0 rounded-md opacity-0 bg-muted transition-opacity duration-150 group-hover:opacity-100" />
              )}

              {/* Content */}
              <span className="relative flex items-center gap-2.5">
                <Icon className={cn("h-4 w-4 transition-transform duration-150", active && "scale-105")} />
                {item.label}
              </span>

              {/* Badge */}
              {item.badge ? (
                <motion.span
                  className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
                >
                  {item.badge}
                </motion.span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Footer chip */}
      <div className="border-t border-border p-3">
        <motion.div
          className="manifest-chip w-full justify-center"
          whileHover={{ scale: 1.02 }}
        >
          GR-ORG · WORLD ACCESS
        </motion.div>
      </div>
    </aside>
  );
}
