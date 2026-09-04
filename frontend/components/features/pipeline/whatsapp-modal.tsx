"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lead } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  MessageCircle, 
  Sparkles, 
  Phone, 
  Building2, 
  CheckCheck,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WhatsAppModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppModal({ lead, isOpen, onClose }: WhatsAppModalProps) {
  const [mounted, setMounted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("intro");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize or update phone number when lead changes
  useEffect(() => {
    if (lead) {
      setPhoneNumber(lead.phone || "");
      
      const templates: Record<string, string> = {
        intro: `Hi ${lead.name}, I came across your business (${lead.category}) on GlobalReach. We help high-growth companies expand client acquisition. Would love to share a quick 2-minute overview with you!`,
        followup: `Hi ${lead.name}, following up on our recent contact regarding client acquisition opportunities for your team. Are you available for a brief catch-up this week?`,
        demo: `Hi ${lead.name}, would you be open to a quick 10-minute demo this Thursday or Friday on how we can source verified leads for ${lead.name}? Let me know what time suits you best.`,
        custom: ""
      };
      
      setMessage(templates[selectedTemplate] || templates.intro);
    }
  }, [lead, selectedTemplate]);

  if (!mounted || !isOpen || !lead) return null;

  const handleTemplateChange = (tmplKey: string) => {
    setSelectedTemplate(tmplKey);
    const templates: Record<string, string> = {
      intro: `Hi ${lead.name}, I came across your business (${lead.category}) on GlobalReach. We help high-growth companies expand client acquisition. Would love to share a quick 2-minute overview with you!`,
      followup: `Hi ${lead.name}, following up on our recent contact regarding client acquisition opportunities for your team. Are you available for a brief catch-up this week?`,
      demo: `Hi ${lead.name}, would you be open to a quick 10-minute demo this Thursday or Friday on how we can source verified leads for ${lead.name}? Let me know what time suits you best.`,
      custom: message || `Hi ${lead.name}, `
    };
    setMessage(templates[tmplKey] || "");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success("Message copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanPhone = (phone: string) => {
    return phone.replace(/[^0-9]/g, "");
  };

  const handleSendWhatsApp = () => {
    const cleaned = cleanPhone(phoneNumber);
    if (!cleaned || cleaned.length < 7) {
      toast.error("Please enter a valid phone number with country code.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please write a message to send.");
      return;
    }

    const encodedText = encodeURIComponent(message.trim());
    const waUrl = `https://wa.me/${cleaned}?text=${encodedText}`;
    
    window.open(waUrl, "_blank", "noopener,noreferrer");
    toast.success(`Opening WhatsApp chat for ${lead.name}...`);
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#25D366]/30 bg-card shadow-[0_16px_50px_rgba(0,0,0,0.35)] z-10 scrollbar-thin flex flex-col"
        >
          {/* WhatsApp Themed Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] px-5 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white shadow-inner">
                  {/* WhatsApp SVG Icon */}
                  <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c4.56 0 8.25 3.69 8.25 8.24 0 2.2-.86 4.28-2.42 5.83a8.21 8.21 0 0 1-5.83 2.42c-1.44 0-2.86-.38-4.11-1.11l-.3-.18-3.05.8 1.05-2.97-.2-.31a8.17 8.17 0 0 1-1.25-4.48c0-4.55 3.7-8.24 8.26-8.24m4.53 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.78 2.71 4.3 3.8.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    {lead.name}
                    <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-normal">
                      WhatsApp Outreach
                    </span>
                  </h3>
                  <p className="text-xs text-white/80 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-3 w-3" />
                    {lead.city ? `${lead.city}, ` : ""}{lead.country}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Phone Input Row */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#25D366]" />
                  Recipient WhatsApp Phone (Include country code)
                </span>
                {!phoneNumber && (
                  <span className="text-[10px] text-amber-500 font-medium">
                    No phone saved — enter below
                  </span>
                )}
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="e.g. +1 555 123 4567 or 902125550142"
                  value={phoneNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                  className="font-mono text-sm pl-3 pr-8 focus-visible:ring-[#25D366]"
                />
                {phoneNumber && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                    ✓
                  </span>
                )}
              </div>
            </div>

            {/* Template Selector Pills */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Quick Outreach Templates
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: "intro", label: "Introduction" },
                  { id: "followup", label: "Follow-up" },
                  { id: "demo", label: "Book Demo" },
                  { id: "custom", label: "Custom" },
                ].map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleTemplateChange(tmpl.id)}
                    className={cn(
                      "text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all text-center truncate",
                      selectedTemplate === tmpl.id
                        ? "border-[#25D366] bg-[#25D366]/10 text-foreground font-semibold shadow-sm"
                        : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Message Content
                </label>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {message.length} chars
                </span>
              </div>
              <Textarea
                rows={4}
                value={message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                placeholder="Type your WhatsApp message..."
                className="text-sm resize-none focus-visible:ring-[#25D366] leading-relaxed"
              />
            </div>

            {/* WhatsApp Chat Bubble Preview */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Live Chat Preview
              </label>
              <div className="rounded-xl border border-border bg-slate-950/20 dark:bg-black/30 p-3.5 relative overflow-hidden">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#DCF8C6] dark:bg-[#005c4b] p-3 text-slate-900 dark:text-slate-100 text-xs shadow-sm space-y-1">
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {message || "Enter your message above to preview..."}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 dark:text-slate-300">
                      <span>Just now</span>
                      <CheckCheck className="h-3.5 w-3.5 text-[#34B7F1]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-border bg-muted/30 p-4 flex items-center justify-between gap-3 mt-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy text"}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSendWhatsApp}
                className="gap-2 text-xs font-semibold bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-md shadow-[#25D366]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c4.56 0 8.25 3.69 8.25 8.24 0 2.2-.86 4.28-2.42 5.83a8.21 8.21 0 0 1-5.83 2.42c-1.44 0-2.86-.38-4.11-1.11l-.3-.18-3.05.8 1.05-2.97-.2-.31a8.17 8.17 0 0 1-1.25-4.48c0-4.55 3.7-8.24 8.26-8.24m4.53 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.78 2.71 4.3 3.8.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z" />
                </svg>
                Send via WhatsApp
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
