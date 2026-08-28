"use client";

import { Search, Bell, Moon, Sun, Command as CommandIcon, Zap, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/lib/hooks/use-theme";
import { motion, AnimatePresence } from "framer-motion";
import { tapProps } from "@/lib/motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";

const MotionButton = motion(Button);

export function Topbar({ title, actions }: { title: string; actions?: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

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

        {/* Upgrade Button */}
        <Link href="/dashboard/settings?tab=billing" passHref legacyBehavior>
          <MotionButton
            variant="default"
            size="sm"
            className="h-8 gap-1.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium text-xs rounded-full border-none shadow-sm mr-1.5"
            {...tapProps}
          >
            <Zap className="h-3.5 w-3.5 fill-white text-white animate-pulse" />
            <span className="hidden sm:inline">Upgrade</span>
          </MotionButton>
        </Link>

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
          className="relative mr-1"
          {...tapProps}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent animate-ping" style={{ animationDuration: '2s' }} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        </MotionButton>

        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {user?.full_name ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : user?.email ? user.email.slice(0, 2).toUpperCase() : "US"}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          <AnimatePresence>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 z-50 w-48 rounded-lg border border-border bg-popover p-1.5 shadow-md text-popover-foreground"
                >
                  <div className="px-2.5 py-2 border-b border-border/60">
                    <p className="text-xs font-semibold truncate">{user?.full_name || "User"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user?.email || ""}</p>
                  </div>
                  
                  <div className="mt-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push("/dashboard/settings?tab=profile");
                      }}
                      className="w-full text-left flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                      Profile Settings
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
