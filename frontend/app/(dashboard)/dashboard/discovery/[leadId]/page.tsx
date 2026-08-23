"use client";

import { useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Star,
  Phone,
  MessageSquare,
  Bookmark,
  Globe,
  Mail,
  FileText,
  Image as ImageIcon,
  Sheet,
  Download,
  Send,
  Clock,
  UserPlus,
  StickyNote,
  History,
  Trash2,
  Edit2,
  Tag as TagIcon,
  Plus,
  X,
  Shield,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
} from "lucide-react";
import { Topbar } from "@/components/features/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { getFiles } from "@/lib/mock/profile";
import { cn, formatCoords, initials } from "@/lib/utils";
import { PipelineStage } from "@/types";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from "@/lib/hooks/use-contacts";
import {
  useTags,
  useCreateTag,
  useAttachTag,
  useDetachTag,
} from "@/lib/hooks/use-tags";
import { useInteractions, useCreateInteraction } from "@/lib/hooks/use-interactions";
import { toast } from "sonner";

const stages: PipelineStage[] = ["new", "contacted", "responded", "negotiating", "won", "lost"];
const stageColor: Record<PipelineStage, "default" | "secondary" | "success" | "danger" | "accent"> = {
  new: "secondary",
  contacted: "default",
  responded: "accent",
  negotiating: "accent",
  won: "success",
  lost: "danger",
};

const fileIcon = { pdf: FileText, doc: FileText, image: ImageIcon, sheet: Sheet };

export default function ClientProfilePage() {
  const params = useParams<{ leadId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<"activity" | "notes">("activity");
  const [draftNote, setDraftNote] = useState("");

  // Lead base store (contains stage and local mock state fallback)
  const lead = useLeadsStore((s) => s.getLead(params.leadId));
  const setStage = useLeadsStore((s) => s.setStage);
  const toggleSaved = useLeadsStore((s) => s.toggleSaved);

  // Dynamic Contacts API
  const { data: contacts = [], isLoading: isLoadingContacts } = useContacts(params.leadId);
  const createContactMutation = useCreateContact(params.leadId);
  const updateContactMutation = useUpdateContact(params.leadId);
  const deleteContactMutation = useDeleteContact(params.leadId);

  // Contact modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    title: "",
    email: "",
    phone: "",
    consent_status: "unknown",
  });

  // Dynamic Tags API
  const { data: globalTags = [] } = useTags();
  const createTagMutation = useCreateTag();
  const attachTagMutation = useAttachTag(params.leadId);
  const detachTagMutation = useDetachTag(params.leadId);
  const [newTagName, setNewTagName] = useState("");
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);

  // Dynamic Interactions API
  const { data: interactionsData, isLoading: isLoadingInteractions } = useInteractions(params.leadId);
  const createInteractionMutation = useCreateInteraction(params.leadId);

  if (!lead) return notFound();

  // Attached files (retained mock)
  const files = getFiles(lead);

  // Handlers for Contacts
  const handleOpenAddContact = () => {
    setEditingContactId(null);
    setContactForm({
      name: "",
      title: "",
      email: "",
      phone: "",
      consent_status: "unknown",
    });
    setIsContactModalOpen(true);
  };

  const handleOpenEditContact = (c: any) => {
    setEditingContactId(c.id);
    setContactForm({
      name: c.name,
      title: c.title || "",
      email: c.email || "",
      phone: c.phone || "",
      consent_status: c.consent_status || "unknown",
    });
    setIsContactModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim()) {
      toast.error("Contact name is required");
      return;
    }

    try {
      if (editingContactId) {
        await updateContactMutation.mutateAsync({
          contactId: editingContactId,
          payload: contactForm,
        });
      } else {
        await createContactMutation.mutateAsync(contactForm);
      }
      setIsContactModalOpen(false);
    } catch (err) {}
  };

  const handleDeleteContact = async (contactId: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      try {
        await deleteContactMutation.mutateAsync(contactId);
      } catch (err) {}
    }
  };

  // Handlers for Tags
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      await createTagMutation.mutateAsync({ name: newTagName.trim() });
      setNewTagName("");
    } catch (err) {}
  };

  const handleToggleTag = async (tagId: string, isAttached: boolean) => {
    try {
      if (isAttached) {
        await detachTagMutation.mutateAsync(tagId);
      } else {
        await attachTagMutation.mutateAsync(tagId);
      }
    } catch (err) {}
  };

  // Handlers for Interactions
  const handleAddNote = async () => {
    if (!draftNote.trim()) return;
    try {
      await createInteractionMutation.mutateAsync({
        type: "note",
        summary: draftNote.trim(),
      });
      setDraftNote("");
    } catch (err) {}
  };

  const isManagerOrAdmin = user?.role === "manager" || user?.role === "admin";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Topbar title="Client profile" />

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-5xl p-6">
          <button
            onClick={() => router.push("/dashboard/discovery")}
            className="mb-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Discovery
          </button>

          {/* Header */}
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-subtle sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted text-base font-semibold text-muted-foreground">
                {initials(lead.name)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl font-semibold tracking-tight">{lead.name}</h1>
                  <Badge variant={stageColor[lead.stage]} className="capitalize">{lead.stage}</Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{lead.category} · {lead.industry}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {lead.address}</span>
                  {lead.rating && (
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-accent text-accent" /> {lead.rating} ({lead.reviewCount} reviews)</span>
                  )}
                  <span className="manifest-chip">{formatCoords(lead.lat, lead.lng)} · {lead.countryCode}</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => toggleSaved(lead.id)}>
                <Bookmark className={cn("h-3.5 w-3.5", lead.savedByMe && "fill-primary text-primary")} />
                {lead.savedByMe ? "Saved" : "Save"}
              </Button>
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="inline-block">
                  <Button variant="secondary" size="sm" className="gap-1">
                    <Phone className="h-3.5 w-3.5" /> Call
                  </Button>
                </a>
              )}
              {lead.phone ? (
                <a
                  href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button size="sm" className="gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> Message
                  </Button>
                </a>
              ) : (
                <Button size="sm" className="gap-1" disabled>
                  <MessageSquare className="h-3.5 w-3.5" /> Message
                </Button>
              )}
            </div>
          </div>

          {/* Stage selector */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto rounded-lg border border-border bg-card p-2 shadow-subtle">
            <span className="shrink-0 pl-2 text-xs font-medium text-muted-foreground">Outreach status</span>
            {stages.map((s) => (
              <button
                key={s}
                onClick={() => setStage(lead.id, s)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
                  lead.stage === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="space-y-6 lg:col-span-1">
              <Card>
                <CardHeader><CardTitle>Location</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="mx-5 mb-5 h-40 overflow-hidden rounded-md bg-[hsl(224,33%,7%)]">
                    <MiniMapEmbed lat={lead.lat} lng={lead.lng} />
                  </div>
                </CardContent>
              </Card>

              {/* Organization and Tags Card */}
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Organization & Tags</CardTitle>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => setIsTagPopoverOpen(!isTagPopoverOpen)}
                    >
                      <TagIcon className="h-3 w-3" /> Manage
                    </Button>
                    {isTagPopoverOpen && (
                      <div className="absolute right-0 top-8 z-50 w-64 rounded-md border border-border bg-popover p-3 shadow-md text-popover-foreground">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold">Toggles Tags</span>
                          <button onClick={() => setIsTagPopoverOpen(false)}>
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1 scrollbar-thin">
                          {globalTags.map((t) => {
                            const isAttached = lead.tags?.includes(t.name) || false;
                            return (
                              <label key={t.id} className="flex items-center gap-2 text-xs cursor-pointer py-1 px-1.5 rounded hover:bg-muted/40">
                                <input
                                  type="checkbox"
                                  checked={isAttached}
                                  onChange={() => handleToggleTag(t.id, isAttached)}
                                  className="rounded border-border accent-primary"
                                />
                                <span className="truncate">{t.name}</span>
                              </label>
                            );
                          })}
                          {globalTags.length === 0 && (
                            <p className="text-[11px] text-muted-foreground">No tags defined yet.</p>
                          )}
                        </div>
                        <form onSubmit={handleCreateTag} className="mt-3 flex gap-1.5 pt-2.5 border-t border-border">
                          <Input
                            placeholder="New tag..."
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            className="h-7 text-xs bg-background/50"
                          />
                          <Button type="submit" size="sm" className="h-7 w-7 p-0 shrink-0">
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <InfoRow icon={Globe} label={lead.website ?? "—"} />
                  <InfoRow icon={Mail} label={lead.email ?? "—"} />
                  <InfoRow icon={Phone} label={lead.phone ?? "—"} />
                  <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                    <span>Company size</span>
                    <span className="font-medium text-foreground">{lead.companySize ?? "Unknown"}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {lead.tags?.map((t) => (
                      <Badge key={t} variant="secondary" className="gap-1 pl-2">
                        {t}
                      </Badge>
                    ))}
                    {(!lead.tags || lead.tags.length === 0) && (
                      <span className="text-xs text-muted-foreground italic">No tags attached</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contacts CRUD Card */}
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle>Contacts ({contacts.length})</CardTitle>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={handleOpenAddContact}>
                    <UserPlus className="h-3.5 w-3.5" /> Add
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoadingContacts ? (
                    <div className="flex justify-center py-4">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : contacts.map((c) => (
                    <div key={c.id} className="flex items-start gap-2.5 justify-between group/contact border-b border-border/20 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-8 w-8"><AvatarFallback>{initials(c.name)}</AvatarFallback></Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {c.name}
                            {c.consent_status === "opted_in" && (
                              <span title="Opted In">
                                <ThumbsUp className="inline h-3 w-3 text-success ml-1.5" />
                              </span>
                            )}
                            {c.consent_status === "opted_out" && (
                              <span title="Opted Out">
                                <ThumbsDown className="inline h-3 w-3 text-danger ml-1.5" />
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{c.title || "No Title"}</p>
                          {c.email && <p className="truncate text-[10px] text-muted-foreground/80">{c.email}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover/contact:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleOpenEditContact(c)}>
                          <Edit2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                        {isManagerOrAdmin && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDeleteContact(c.id)}>
                            <Trash2 className="h-3 w-3 text-danger" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {contacts.length === 0 && !isLoadingContacts && (
                    <p className="text-xs text-muted-foreground italic text-center py-2">No contact person logged yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Files */}
              <Card>
                <CardHeader><CardTitle>Files</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {files.map((f) => {
                    const Icon = fileIcon[f.kind];
                    return (
                      <div key={f.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">{f.name}</p>
                            <p className="text-[11px] text-muted-foreground">{f.size}</p>
                          </div>
                        </div>
                        <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Right column: notes/history timeline */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex-row items-center gap-1 space-y-0 border-b border-border p-2">
                  <TabButton active={tab === "activity"} onClick={() => setTab("activity")} icon={History} label="Activity log" />
                  <TabButton active={tab === "notes"} onClick={() => setTab("notes")} icon={StickyNote} label="Notes" />
                </CardHeader>
                <CardContent className="p-5">
                  {tab === "notes" && (
                    <div className="mb-4 flex gap-2">
                      <textarea
                      value={draftNote}
                      onChange={(e) => setDraftNote(e.target.value)}
                      placeholder="Add a note or manually log activity about this client…"
                      rows={2}
                      className="flex-1 resize-none rounded-md border border-border bg-background p-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                      <Button
                        size="sm"
                        className="self-end gap-1.5"
                        disabled={!draftNote.trim() || createInteractionMutation.isPending}
                        onClick={handleAddNote}
                      >
                        <Send className="h-3.5 w-3.5" />
                        Log
                      </Button>
                    </div>
                  )}

                  <div className="space-y-4">
                    {isLoadingInteractions ? (
                      <div className="flex justify-center py-8">
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : interactionsData?.results && interactionsData.results.length > 0 ? (
                      interactionsData.results
                        .filter(e => tab === "activity" || e.type === "note")
                        .map((e) => {
                          const isNote = e.type === "note";
                          return (
                            <div key={e.id} className="flex gap-3 items-start border-b border-border/10 pb-3 last:border-0 last:pb-0">
                              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                {e.type === "call" && <Phone className="h-3.5 w-3.5" />}
                                {e.type === "email" && <Mail className="h-3.5 w-3.5" />}
                                {e.type === "sms" && <MessageSquare className="h-3.5 w-3.5" />}
                                {e.type === "chat_message" && <Send className="h-3.5 w-3.5" />}
                                {isNote && <StickyNote className="h-3.5 w-3.5 text-accent" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold capitalize text-foreground/90">
                                  {e.type.replace("_", " ")}
                                </p>
                                <p className="text-sm text-foreground/80 mt-0.5 break-words whitespace-pre-wrap">
                                  {e.summary || "No description logged"}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {new Date(e.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <p className="text-sm text-muted-foreground italic text-center py-4">No events logged yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts Add/Edit Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-card shadow-2xl">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle>{editingContactId ? "Edit Contact" : "Add New Contact"}</CardTitle>
              <button onClick={() => setIsContactModalOpen(false)}>
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </CardHeader>
            <form onSubmit={handleSaveContact}>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Full Name *</label>
                  <Input
                    placeholder="e.g. Haruto Sato"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Job Title</label>
                  <Input
                    placeholder="e.g. Procurement Director"
                    value={contactForm.title}
                    onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    placeholder="e.g. haruto@client.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                  <Input
                    placeholder="e.g. +81 90-1234-5678"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Compliance / Consent</label>
                  <select
                    value={contactForm.consent_status}
                    onChange={(e) => setContactForm({ ...contactForm, consent_status: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="unknown">Unknown</option>
                    <option value="opted_in">Opted In (Authorized Outreach)</option>
                    <option value="opted_out">Opted Out (Do Not Contact)</option>
                  </select>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 px-5 pb-5 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsContactModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createContactMutation.isPending || updateContactMutation.isPending}>
                  Save Contact
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate text-foreground">{label}</span>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function MiniMapEmbed({ lat, lng }: { lat: number; lng: number }) {
  const x = ((lng + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return (
    <div className="relative h-full w-full">
      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="mini-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0 L0 0 0 10" fill="none" stroke="hsl(220,20%,20%)" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#mini-grid)" />
      </svg>
      <div
        className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow"
        style={{ left: `${x}%`, top: `${y}%` }}
      />
    </div>
  );
}
