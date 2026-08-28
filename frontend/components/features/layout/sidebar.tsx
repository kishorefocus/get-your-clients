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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "@/lib/stores/chat-store";

const nav = [
  { href: "/dashboard/discovery", label: "Discovery", icon: Search },
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<{ label: string; top: number } | null>(null);

  const { totalUnread, fetchConversations } = useChatStore((s) => ({
    totalUnread: s.totalUnread(),
    fetchConversations: s.fetchConversations,
  }));

  // Fetch conversations to ensure unread badge is populated
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

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
      onAnimationStart={() => setIsAnimating(true)}
      onAnimationComplete={() => setIsAnimating(false)}
      className={cn(
        "relative hidden shrink-0 flex-col border-r border-[#20328c]/30 bg-gradient-to-b from-[#172774] via-[#0c1448] to-[#1a4da6] text-slate-200 md:flex h-full shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.03),4px_0_24px_rgba(0,0,0,0.15)]",
        isAnimating ? "overflow-hidden" : "overflow-visible"
      )}
    >
      {/* Floating Collapse Button */}
      <motion.button
        onClick={handleToggle}
        initial={false}
        animate={{ 
          rotate: isCollapsed ? 180 : 0,
        }}
        whileHover={{ scale: 1.1, backgroundColor: "#203075" }}
        whileTap={{ scale: 0.9 }}
        className="absolute top-4 -right-3 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-blue-600/40 bg-[#162263] text-slate-300 hover:text-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.4)] cursor-pointer focus:outline-none"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </motion.button>

      {/* Logo Area */}
      <div className={cn(
        "flex h-14 items-center border-b border-[#20328c]/30 px-4", 
        isCollapsed ? "justify-center px-2" : "justify-between"
      )}>
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-[0_0_12px_rgba(37,99,235,0.4)] text-white cursor-pointer"
            whileHover={{ scale: 1.12, rotate: 360 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            onClick={() => isCollapsed && handleToggle()}
            title={isCollapsed ? "Expand Sidebar" : undefined}
          >
            <Globe2 className="h-4 w-4" />
          </motion.div>
          
          <motion.span
            animate={{ 
              opacity: isCollapsed ? 0 : 1,
              width: isCollapsed ? 0 : "auto",
              x: isCollapsed ? -10 : 0
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="font-display text-[17px] font-semibold tracking-tight truncate overflow-hidden whitespace-nowrap bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent"
          >
            GlobalReach
          </motion.span>
        </div>
      </div>

      {/* Nav */}
      <nav 
        onScroll={() => setHoveredTooltip(null)}
        className="flex-1 space-y-0.5 overflow-y-auto p-3 scrollbar-thin"
      >
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          const badgeValue = item.href === "/dashboard/inbox" ? totalUnread : item.badge;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isCollapsed ? "justify-center" : "justify-between",
                active
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-100"
              )}
              onMouseEnter={(e) => {
                if (isCollapsed) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const sidebarRect = e.currentTarget.closest("aside")?.getBoundingClientRect();
                  if (rect && sidebarRect) {
                    setHoveredTooltip({
                      label: item.label,
                      top: rect.top - sidebarRect.top + rect.height / 2,
                    });
                  }
                }
              }}
              onMouseLeave={() => {
                setHoveredTooltip(null);
              }}
            >
              {/* Sliding active background — Framer Motion layoutId */}
              {active && (
                <motion.span
                  layoutId="sidebar-active-bg"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/15 to-indigo-500/5 border-l-2 border-blue-400"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              {/* Hover background for inactive items */}
              {!active && (
                <span className="absolute inset-0 rounded-lg opacity-0 bg-white/[0.04] border border-white/[0.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-200 group-hover:opacity-100" />
              )}

              {/* Content */}
              <span className={cn(
                "relative flex items-center gap-3 transition-transform duration-200 ease-out",
                !isCollapsed && "group-hover:translate-x-1"
              )}>
                <Icon className={cn(
                  "h-4 w-4 shrink-0 transition-all duration-200",
                  active 
                    ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.65)]" 
                    : "text-slate-400 group-hover:text-slate-100 group-hover:scale-110"
                )} />
                <motion.span
                  animate={{ 
                    opacity: isCollapsed ? 0 : 1,
                    width: isCollapsed ? 0 : "auto",
                    x: isCollapsed ? -10 : 0
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              </span>

              {/* Badge */}
              {badgeValue ? (
                isCollapsed ? (
                  <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                ) : (
                  <motion.span
                    className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {badgeValue}
                  </motion.span>
                )
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Floating tooltip */}
      <AnimatePresence>
        {isCollapsed && hoveredTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 72 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            style={{ top: hoveredTooltip.top }}
            className="absolute left-0 z-50 pointer-events-none -translate-y-1/2"
          >
            <div className="relative bg-slate-950/95 border border-blue-950 text-slate-100 text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              {hoveredTooltip.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer chip */}
      <div className="border-t border-[#20328c]/30 p-3">
        <motion.div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-blue-700/30 bg-blue-900/20 px-2 py-1.5 font-mono text-[11px] tracking-tight text-blue-300/90 transition-colors duration-150 w-full justify-center overflow-hidden whitespace-nowrap shadow-[0_0_8px_rgba(0,0,0,0.1)]",
            "hover:border-blue-500/40 hover:bg-blue-800/30 hover:text-blue-100"
          )}
          whileHover={{ scale: 1.03 }}
        >
          {isCollapsed ? "GR" : "GR-ORG · WORLD ACCESS"}
        </motion.div>
      </div>
    </motion.aside>
  );
}
