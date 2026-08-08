"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InviteModal({ open, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Admin" | "Manager" | "Rep">("Rep");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSend = async () => {
    if (!isValid) return;
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setEmail("");
      setRole("Rep");
      onClose();
    }, 1800);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle>Invite a teammate</DialogTitle>
          <DialogDescription>
            They'll receive an email with a link to join your GlobalReach organisation.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 px-6 text-center animate-fade-up">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <Send className="h-6 w-6 text-success" />
            </div>
            <p className="font-semibold">Invite sent!</p>
            <p className="text-sm text-muted-foreground">
              An invitation has been sent to <span className="font-mono text-foreground">{email}</span>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-6 py-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className={cn(
                  "w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                  !email || isValid ? "border-border" : "border-danger focus:ring-danger/50"
                )}
              />
              {email && !isValid && (
                <p className="mt-1 text-[11px] text-danger">Enter a valid email address</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Role</label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin — full access</SelectItem>
                  <SelectItem value="Manager">Manager — manage reps & leads</SelectItem>
                  <SelectItem value="Rep">Rep — view & work assigned leads</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {!sent && (
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSend} disabled={!isValid || loading} className="gap-2 min-w-[100px]">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Sending…
                </span>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> Send invite
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
