"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  MessageSquare,
  Mail,
  Globe,
  MapPin,
  Calendar,
  User,
  Star,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Tag,
  Building2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Lead, PipelineStage } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatCountryName, initials } from "@/lib/utils";
import { toast } from "sonner";
import { usePipelineStages, useMoveClient } from "@/lib/hooks/use-pipeline";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { useContacts } from "@/lib/hooks/use-contacts";

interface ClientDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenWhatsApp?: () => void;
}

const allStages: { id: PipelineStage; label: string; color: string }[] = [
  { id: "new", label: "New Lead", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { id: "contacted", label: "Contacted", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { id: "responded", label: "Responded", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  { id: "negotiating", label: "Negotiating", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  { id: "won", label: "Won Deal", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  { id: "lost", label: "Lost", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
];

const priorityColor: Record<string, "secondary" | "accent" | "danger" | "default"> = {
  low: "secondary",
  medium: "accent",
  high: "danger",
};

export function ClientDetailsModal({
  lead,
  isOpen,
  onClose,
  onOpenWhatsApp,
}: ClientDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: stages = [] } = usePipelineStages();
  const moveMutation = useMoveClient();
  const setStoreStage = useLeadsStore((s) => s.setStage);

  // Associated contacts for real client IDs
  const { data: contacts = [] } = useContacts(lead?.id || "");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !lead) return null;

  const cleanPhone = lead.phone ? lead.phone.replace(/[^\d+]/g, "") : "";

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleStageSelect = (stageId: PipelineStage) => {
    if (lead.stage === stageId) return;

    // Local optimistic update
    setStoreStage(lead.id, stageId);

    // API update if backend stages exist
    const targetStage = stages.find((s) => s.name.toLowerCase() === stageId);
    if (targetStage) {
      moveMutation.mutate({
        client_id: lead.id,
        stage_id: targetStage.id,
      });
    }

    if (stageId === "won") {
      toast.success(`🎉 Spectacular! ${lead.name} moved to Won Deal!`);
    } else {
      toast.success(`${lead.name} moved to ${stageId}`);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl z-10 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header with Gradient Accent */}
          <div className="relative border-b border-border/60 bg-gradient-to-r from-muted/40 via-muted/20 to-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-base shadow-sm">
                  {initials(lead.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-foreground truncate">{lead.name}</h2>
                    <Badge variant={priorityColor[lead.priority] || "secondary"} className="capitalize text-[10px] px-1.5 py-0">
                      {lead.priority} priority
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-3 w-3 shrink-0" />
                    <span>{lead.category || lead.industry || "Discovered Lead"}</span>
                  </p>
                  {lead.rating != null && (
                    <div className="flex items-center gap-1 text-xs text-amber-500 mt-1 font-medium">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span>{lead.rating}</span>
                      {lead.reviewCount != null && (
                        <span className="text-muted-foreground font-normal">({lead.reviewCount} reviews)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Action Buttons Row */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {/* Direct Phone Call Button */}
              {lead.phone ? (
                <a
                  href={`tel:${cleanPhone}`}
                  title={`Dial ${lead.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call Dialer ({lead.phone})</span>
                </a>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  className="h-8 text-xs gap-1.5 opacity-60 cursor-not-allowed"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>No Phone Number</span>
                </Button>
              )}

              {/* WhatsApp Button */}
              {onOpenWhatsApp && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWhatsApp();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c4.56 0 8.25 3.69 8.25 8.24 0 2.2-.86 4.28-2.42 5.83a8.21 8.21 0 0 1-5.83 2.42c-1.44 0-2.86-.38-4.11-1.11l-.3-.18-3.05.8 1.05-2.97-.2-.31a8.17 8.17 0 0 1-1.25-4.48c0-4.55 3.7-8.24 8.26-8.24m4.53 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.78 2.71 4.3 3.8.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z" />
                  </svg>
                  <span>WhatsApp Outreach</span>
                </button>
              )}

              {/* Email Button */}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border shadow-xs transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Email</span>
                </a>
              )}

              {/* Website Button */}
              {lead.website && (
                <a
                  href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border shadow-xs transition-colors"
                >
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Website</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              )}
            </div>
          </div>

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs scrollbar-thin">
            {/* Pipeline Stage Switcher */}
            <div className="rounded-xl border border-border bg-muted/20 p-3.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Pipeline Stage (Click to move)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {allStages.map((st) => {
                  const isActive = lead.stage === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleStageSelect(st.id)}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all text-left",
                        isActive
                          ? `${st.color} font-semibold ring-1 ring-primary/40 shadow-xs`
                          : "border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="truncate">{st.label}</span>
                      {isActive && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 ml-1 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact & Location Details */}
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Contact & Location
              </span>

              {/* Phone Row */}
              <div className="flex items-center justify-between py-1 border-b border-border/40 gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                  <Phone className="h-3.5 w-3.5 text-primary" /> Phone:
                </span>
                {lead.phone ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${cleanPhone}`}
                      className="font-mono font-medium text-primary hover:underline"
                    >
                      {lead.phone}
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(lead.phone!, "Phone")}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                      title="Copy phone"
                    >
                      {copiedField === "Phone" ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-muted-foreground/60 italic">Not available</span>
                )}
              </div>

              {/* Email Row */}
              <div className="flex items-center justify-between py-1 border-b border-border/40 gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                  <Mail className="h-3.5 w-3.5 text-primary" /> Email:
                </span>
                {lead.email ? (
                  <div className="flex items-center gap-2 truncate">
                    <a
                      href={`mailto:${lead.email}`}
                      className="font-medium text-primary hover:underline truncate"
                    >
                      {lead.email}
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(lead.email!, "Email")}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded shrink-0"
                      title="Copy email"
                    >
                      {copiedField === "Email" ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-muted-foreground/60 italic">Not available</span>
                )}
              </div>

              {/* Address / Location */}
              <div className="flex items-start justify-between py-1 border-b border-border/40 gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5 shrink-0 pt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Location:
                </span>
                <span className="text-right font-medium text-foreground">
                  {lead.address ? `${lead.address}, ` : ""}
                  {lead.city && `${lead.city}, `}
                  {formatCountryName(lead.countryCode) || lead.country || "Unknown Location"}
                </span>
              </div>

              {/* Website */}
              {lead.website && (
                <div className="flex items-center justify-between py-1 gap-2">
                  <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                    <Globe className="h-3.5 w-3.5 text-primary" /> Website:
                  </span>
                  <a
                    href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    <span className="truncate">{lead.website.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                  </a>
                </div>
              )}
            </div>

            {/* Sales Info & Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                  Assigned Rep
                </span>
                <div className="flex items-center gap-2 pt-0.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    {lead.assignedRep ? initials(lead.assignedRep) : <User className="h-3 w-3" />}
                  </div>
                  <span className="font-medium text-foreground truncate">
                    {lead.assignedRep || "Unassigned"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                  Next Follow-Up
                </span>
                <div className="flex items-center gap-2 pt-0.5 font-medium text-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  {lead.nextFollowUp ? (
                    <span>
                      {new Date(lead.nextFollowUp).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">No follow-up set</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {lead.tags && lead.tags.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-3.5 space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Tags & Badges
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {lead.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Associated Contacts (if any) */}
            {contacts && contacts.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Associated Contacts ({contacts.length})
                </span>
                <div className="space-y-2">
                  {contacts.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground">{c.title || "Contact"}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {c.phone && (
                          <a
                            href={`tel:${c.phone}`}
                            className="p-1 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25"
                            title={`Call ${c.name}`}
                          >
                            <Phone className="h-3 w-3" />
                          </a>
                        )}
                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            className="p-1 rounded bg-muted hover:bg-muted/80 text-foreground"
                            title={`Email ${c.name}`}
                          >
                            <Mail className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="border-t border-border bg-muted/20 p-3.5 sm:p-4 flex items-center justify-between gap-2 mt-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Close
            </Button>

            <Link
              href={`/dashboard/discovery/${lead.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Open Full Profile</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
