"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, KanbanSquare, Inbox, Phone, BarChart3, Users, Plus } from "lucide-react";

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
        className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-popover animate-fade-up"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Command.Input
            autoFocus
            placeholder="Search leads, or jump to a page…"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
          <Command.Empty className="p-4 text-center text-sm text-muted-foreground">No results found.</Command.Empty>
          <Command.Group heading="Navigate" className="px-2 py-1 text-xs font-medium text-muted-foreground">
            <Item icon={Search} label="Discovery / Search" onSelect={() => go("/dashboard/discovery")} />
            <Item icon={KanbanSquare} label="Pipeline" onSelect={() => go("/dashboard/pipeline")} />
            <Item icon={Inbox} label="Inbox" onSelect={() => go("/dashboard/inbox")} />
            <Item icon={Phone} label="Calls" onSelect={() => go("/dashboard/calls")} />
            <Item icon={BarChart3} label="Analytics" onSelect={() => go("/dashboard/analytics")} />
            <Item icon={Users} label="Team" onSelect={() => go("/dashboard/team")} />
          </Command.Group>
          <Command.Group heading="Quick actions" className="px-2 py-1 text-xs font-medium text-muted-foreground">
            <Item icon={Plus} label="Start a new search" onSelect={() => go("/dashboard/discovery")} />
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}

function Item({ icon: Icon, label, onSelect }: { icon: any; label: string; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm aria-selected:bg-muted"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </Command.Item>
  );
}
