"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search, KanbanSquare, Inbox, Phone, BarChart3, Users,
  Plus, MessageSquare, UserPlus, Download, Settings,
  LayoutDashboard, PhoneCall, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 pt-[15vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <Command
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-popover animate-fade-up"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Command.Input
            autoFocus
            placeholder="Search leads, navigate pages, or run actions…"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
        </div>
        <Command.List className="max-h-[420px] overflow-y-auto p-2 scrollbar-thin">
          <Command.Empty className="p-6 text-center text-sm text-muted-foreground">No results found.</Command.Empty>

          <Command.Group heading="Navigate">
            <Item icon={LayoutDashboard} label="Dashboard — Overview" onSelect={() => go("/dashboard")} />
            <Item icon={Search} label="Discovery — Search clients" onSelect={() => go("/dashboard/discovery")} />
            <Item icon={KanbanSquare} label="Pipeline — Kanban board" onSelect={() => go("/dashboard/pipeline")} />
            <Item icon={Inbox} label="Inbox — Client conversations" onSelect={() => go("/dashboard/inbox")} />
            <Item icon={Phone} label="Call Center — Calls & dialer" onSelect={() => go("/dashboard/calls")} />
            <Item icon={BarChart3} label="Analytics — Reports & charts" onSelect={() => go("/dashboard/analytics")} />
            <Item icon={Users} label="Team — Members & permissions" onSelect={() => go("/dashboard/team")} />
            <Item icon={Settings} label="Settings — Profile & billing" onSelect={() => go("/dashboard/settings")} />
          </Command.Group>

          <Command.Group heading="Quick Actions">
            <Item icon={Plus} label="New search — discover clients" onSelect={() => go("/dashboard/discovery")} />
            <Item icon={MessageSquare} label="New conversation — open inbox" onSelect={() => go("/dashboard/inbox")} />
            <Item icon={PhoneCall} label="Start a call — open dialer" onSelect={() => go("/dashboard/calls")} />
            <Item icon={UserPlus} label="Invite teammate — open team" onSelect={() => go("/dashboard/team")} />
            <Item icon={Download} label="Export report — open analytics" onSelect={() => go("/dashboard/analytics")} />
            <Item icon={Zap} label="Configure integrations — settings" onSelect={() => go("/dashboard/settings")} />
          </Command.Group>
        </Command.List>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <span className="text-[10px] text-muted-foreground">
            <kbd className="rounded border border-border px-1 py-0.5 text-[9px]">↑↓</kbd> navigate &nbsp;
            <kbd className="rounded border border-border px-1 py-0.5 text-[9px]">↵</kbd> select &nbsp;
            <kbd className="rounded border border-border px-1 py-0.5 text-[9px]">ESC</kbd> close
          </span>
          <span className="manifest-chip">GlobalReach · CMD+K</span>
        </div>
      </Command>
    </div>
  );
}

function Item({ icon: Icon, label, onSelect }: { icon: React.ElementType; label: string; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors aria-selected:bg-muted"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </Command.Item>
  );
}
