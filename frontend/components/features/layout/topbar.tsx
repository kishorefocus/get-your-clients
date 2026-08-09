"use client";

import { Search, Bell, Moon, Sun, Command as CommandIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/lib/hooks/use-theme";
import { motion, AnimatePresence } from "framer-motion";
import { tapProps } from "@/lib/motion";

const MotionButton = motion(Button);

export function Topbar({ title, actions }: { title: string; actions?: React.ReactNode }) {
  const { theme, toggle } = useTheme();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-5">
      <h1 className="font-display text-[19px] font-semibold tracking-tight">{title}</h1>

      <div className="flex items-center gap-2">
        {actions && <>{actions}</>}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="hidden items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted sm:flex transition-colors duration-150"
        >
          <Search className="h-3.5 w-3.5" />
          Search leads…
          <span className="ml-4 flex items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5">
            <CommandIcon className="h-2.5 w-2.5" /> K
          </span>
        </motion.button>

        <MotionButton
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label="Toggle dark mode"
          className="relative overflow-hidden"
          {...tapProps}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ y: -10, opacity: 0, rotate: -45 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 10, opacity: 0, rotate: 45 }}
              transition={{ duration: 0.15 }}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </motion.div>
          </AnimatePresence>
        </MotionButton>

        <MotionButton
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
          {...tapProps}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent animate-ping" style={{ animationDuration: '2s' }} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        </MotionButton>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="cursor-pointer"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=Aylin" alt="Aylin Kaya" />
            <AvatarFallback>AK</AvatarFallback>
          </Avatar>
        </motion.div>
      </div>
    </header>
  );
}
