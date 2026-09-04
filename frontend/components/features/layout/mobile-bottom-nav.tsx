"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Search, 
  KanbanSquare, 
  LayoutDashboard, 
  Inbox, 
  Phone,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useChatStore } from "@/lib/stores/chat-store";
import { useUiStore } from "@/lib/stores/ui-store";

type NavItem =
  | { href: string; label: string; icon: any; isInbox?: boolean; isAction?: false }
  | { label: string; icon: any; isAction: true; onClick: () => void };

export function MobileBottomNav() {
  const pathname = usePathname();
  const totalUnread = useChatStore((s) => s.totalUnread());
  const { isMobileMenuOpen, openMobileMenu } = useUiStore();

  const navItems: NavItem[] = [
    { href: "/dashboard/discovery", label: "Discovery", icon: Search },
    { href: "/dashboard/pipeline", label: "Pipeline", icon: KanbanSquare },
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/inbox", label: "Inbox", icon: Inbox, isInbox: true },
    { href: "/dashboard/calls", label: "Calls", icon: Phone },
    { isAction: true, label: "Menu", icon: Menu, onClick: openMobileMenu },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.12)] px-2 flex items-center justify-around"
    >
      {navItems.map((item) => {
        if (item.isAction) {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center py-1 text-center transition-colors min-w-0 select-none",
                isMobileMenuOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon 
                  className={cn(
                    "h-5 w-5 transition-transform", 
                    isMobileMenuOpen ? "scale-110 text-primary drop-shadow-[0_0_6px_rgba(37,99,235,0.4)]" : ""
                  )} 
                />
              </div>

              <span className={cn(
                "text-[10px] mt-0.5 tracking-tight font-medium truncate max-w-[56px]",
                isMobileMenuOpen ? "font-semibold text-primary" : ""
              )}>
                {item.label}
              </span>
            </button>
          );
        }

        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname?.startsWith(item.href));
        const Icon = item.icon;
        const badge = item.isInbox ? totalUnread : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center py-1 text-center transition-colors min-w-0 select-none",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.div
                layoutId="mobile-nav-pill"
                className="absolute inset-x-2 -top-1 h-0.5 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            <div className="relative">
              <Icon 
                className={cn(
                  "h-5 w-5 transition-transform", 
                  active ? "scale-110 text-primary drop-shadow-[0_0_6px_rgba(37,99,235,0.4)]" : ""
                )} 
              />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-slate-950 shadow-sm animate-pulse">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </div>

            <span className={cn(
              "text-[10px] mt-0.5 tracking-tight font-medium truncate max-w-[56px]",
              active ? "font-semibold text-primary" : ""
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
