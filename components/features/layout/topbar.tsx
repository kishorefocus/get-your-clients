"use client";

import { Search, Bell, Moon, Sun, Command as CommandIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/lib/hooks/use-theme";

export function Topbar({ title, actions }: { title: string; actions?: React.ReactNode }) {
  const { theme, toggle } = useTheme();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-5">
      <h1 className="font-display text-[19px] font-semibold tracking-tight">{title}</h1>

      <div className="flex items-center gap-2">
        {actions && <>{actions}</>}
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="hidden items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted sm:flex"
        >
          <Search className="h-3.5 w-3.5" />
          Search leads…
          <span className="ml-4 flex items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5">
            <CommandIcon className="h-2.5 w-2.5" /> K
          </span>
        </button>

        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        </Button>

        <Avatar className="h-8 w-8">
          <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Aylin" alt="Aylin Kaya" />
          <AvatarFallback>AK</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
