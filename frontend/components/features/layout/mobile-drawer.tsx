"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search as SearchIcon,
  KanbanSquare,
  Inbox,
  Phone as PhoneIcon,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  Globe2,
  X,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/stores/ui-store";
import { useAuth } from "@/lib/hooks/use-auth";
import { useChatStore } from "@/lib/stores/chat-store";

const mobileNavItems = [
  { href: "/dashboard/discovery", label: "Discovery", icon: SearchIcon },
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/dashboard/inbox", label: "Inbox", icon: Inbox, isInbox: true },
  { href: "/dashboard/calls", label: "Calls", icon: PhoneIcon },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

export function MobileDrawer() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { isMobileMenuOpen, closeMobileMenu } = useUiStore();
  const { user, logout } = useAuth();
  const totalUnread = useChatStore((s) => s.totalUnread());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden">
          {/* Overlay backdrop spanning full screen */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeMobileMenu}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Drawer container spanning full screen height */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 left-0 z-[10000] flex w-72 max-w-[85vw] flex-col border-r border-[#20328c]/40 bg-gradient-to-b from-[#172774] via-[#0c1448] to-[#1a4da6] text-slate-200 shadow-2xl p-4 h-full"
          >
            {/* Header */}
            <div className="flex h-12 items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md">
                  <Globe2 className="h-4 w-4" />
                </div>
                <span className="font-display text-[17px] font-semibold text-white tracking-tight">
                  GlobalReach
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-300 hover:text-white hover:bg-white/10 rounded-full"
                onClick={closeMobileMenu}
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1 py-4 overflow-y-auto scrollbar-thin">
              {mobileNavItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                const Icon = item.icon;
                const badge = item.isInbox ? totalUnread : 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative",
                      active
                        ? "bg-white/15 text-white border-l-2 border-blue-400 font-semibold shadow-inner"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className={cn("h-4 w-4", active ? "text-blue-400" : "text-slate-400")} />
                      {item.label}
                    </span>

                    {badge > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-slate-950">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Profile & Logout at Bottom of Drawer */}
            <div className="border-t border-white/10 pt-3 shrink-0 space-y-2">
              <div className="flex items-center gap-2.5 px-2 py-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-xs shrink-0">
                  {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : "US"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{user?.full_name || "User"}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email || ""}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  closeMobileMenu();
                  logout();
                }}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
