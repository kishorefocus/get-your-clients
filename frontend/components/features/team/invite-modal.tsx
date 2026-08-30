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
import { Send, UserPlus, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { scaleIn, springUI, tapProps } from "@/lib/motion";
import { useInviteMember } from "@/lib/hooks/use-org";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InviteModal({ open, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Admin" | "Manager" | "Rep">("Rep");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");

  const inviteMemberMutation = useInviteMember();

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSend = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const response = await inviteMemberMutation.mutateAsync({
        email,
        role: role.toLowerCase() as "admin" | "manager" | "rep",
      });
      if (response && response.token) {
        const url = `${window.location.origin}/onboard?token=${response.token}`;
        setInviteUrl(url);
      }
      setSent(true);
    } catch (err) {
      // errors handled by mutation toast
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSent(false);
    setEmail("");
    setRole("Rep");
    setInviteUrl("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md overflow-hidden">
        <DialogHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle>Invite a teammate</DialogTitle>
          <DialogDescription>
            They'll receive an email with a link to join your GlobalReach organisation.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="sent-state"
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center gap-3 py-6 px-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={springUI}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10"
              >
                <CheckCircle2 className="h-6 w-6 text-success" />
              </motion.div>
              <p className="font-semibold">Invite sent!</p>
              <p className="text-sm text-muted-foreground mb-2">
                An invitation has been sent to <span className="font-mono text-foreground">{email}</span>
              </p>

              {inviteUrl && (
                <div className="w-full text-left bg-muted/30 border border-border/80 rounded-xl p-3 mt-2 animate-fade-up">
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1 uppercase tracking-wider">
                    Onboarding Link (for testing):
                  </label>
                  <div className="flex gap-2 items-center bg-card border rounded-lg p-2 text-xs font-mono select-all break-all">
                    <span className="flex-1 overflow-hidden truncate text-foreground">{inviteUrl}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[10px] shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteUrl);
                        toast.success("Link copied to clipboard!");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-4 w-full flex justify-end">
                <Button onClick={handleClose} className="w-full sm:w-auto">Done</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4 px-6 py-4"
            >
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
                    "w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow focus:border-primary/45",
                    !email || isValid ? "border-border" : "border-danger focus:ring-danger/30"
                  )}
                />
                {email && !isValid && (
                  <p className="mt-1 text-[11px] text-danger">Enter a valid email address</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Role</label>
                <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                  <SelectTrigger className="focus:ring-2 focus:ring-ring/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin — full access</SelectItem>
                    <SelectItem value="Manager">Manager — manage reps & leads</SelectItem>
                    <SelectItem value="Rep">Rep — view & work assigned leads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!sent && (
          <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <motion.div {...tapProps}>
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
            </motion.div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
