"use client";

import { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load from local storage on client side
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const handleToggle = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 64 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden shrink-0 flex-col border-r border-border bg-background md:flex h-full overflow-hidden"
    >
      {/* Logo */}
      <div className={cn("flex h-14 items-center justify-between border-b border-border px-4", isCollapsed && "justify-center px-2")}>
        <div className="flex items-center gap-2 min-w-0">
          <motion.div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Globe2 className="h-4 w-4" />
          </motion.div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-display text-[17px] font-semibold tracking-tight truncate"
            >
              GlobalReach
            </motion.span>
          )}
        </div>
        
        <button
          onClick={handleToggle}
          className={cn(
            "p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            isCollapsed && "mt-1"
          )}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
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
                "group relative flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                isCollapsed ? "justify-center" : "justify-between",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={isCollapsed ? item.label : undefined}
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
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </span>

              {/* Badge */}
              {item.badge ? (
                isCollapsed ? (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-accent" />
                ) : (
                  <motion.span
                    className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
                  >
                    {item.badge}
                  </motion.span>
                )
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Footer chip */}
      <div className="border-t border-border p-3">
        <motion.div
          className="manifest-chip w-full justify-center overflow-hidden whitespace-nowrap"
          whileHover={{ scale: 1.02 }}
        >
          {isCollapsed ? "GR" : "GR-ORG · WORLD ACCESS"}
        </motion.div>
      </div>
    </motion.aside>
  );
}
