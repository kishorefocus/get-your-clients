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
} from "lucide-react";
import { Topbar } from "@/components/features/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLeadsStore } from "@/lib/stores/leads-store";
import { getContacts, getFiles } from "@/lib/mock/profile";
import { cn, formatCoords, initials } from "@/lib/utils";
import { PipelineStage } from "@/types";

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
  const [tab, setTab] = useState<"activity" | "notes">("activity");
  const [draftNote, setDraftNote] = useState("");

  const lead = useLeadsStore((s) => s.getLead(params.leadId));
  const setStage = useLeadsStore((s) => s.setStage);
  const toggleSaved = useLeadsStore((s) => s.toggleSaved);
  const addNote = useLeadsStore((s) => s.addNote);
  const activity = useLeadsStore((s) => s.activity[params.leadId] ?? []);
  const notes = useLeadsStore((s) => s.notes[params.leadId] ?? []);

  if (!lead) return notFound();

  const contacts = getContacts(lead);
  const files = getFiles(lead);

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
                <Button variant="secondary" size="sm"><Phone className="h-3.5 w-3.5" /> Call</Button>
              )}
              <Button size="sm"><MessageSquare className="h-3.5 w-3.5" /> Message</Button>
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

              <Card>
                <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <InfoRow icon={Globe} label={lead.website ?? "—"} />
                  <InfoRow icon={Mail} label={lead.email ?? "—"} />
                  <InfoRow icon={Phone} label={lead.phone ?? "—"} />
                  <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                    <span>Company size</span>
                    <span className="font-medium text-foreground">{lead.companySize ?? "Unknown"}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {lead.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle>Contacts</CardTitle>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"><UserPlus className="h-3.5 w-3.5" /> Add</Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contacts.map((c) => (
                    <div key={c.id} className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8"><AvatarFallback>{initials(c.name)}</AvatarFallback></Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {c.name} {c.isPrimary && <span className="ml-1 text-[10px] font-medium text-primary">PRIMARY</span>}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{c.title}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

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
                        placeholder="Add a note about this client…"
                        rows={2}
                        className="flex-1 resize-none rounded-md border border-border bg-background p-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <Button
                        size="sm"
                        className="self-end"
                        disabled={!draftNote.trim()}
                        onClick={() => { addNote(lead.id, draftNote.trim()); setDraftNote(""); }}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  <div className="space-y-4">
                    {tab === "activity"
                      ? activity.map((e) => (
                          <div key={e.id} className="flex gap-3">
                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-sm">{e.label}</p>
                              <p className="text-xs text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        ))
                      : notes.length === 0
                        ? <p className="text-sm text-muted-foreground">No notes yet — add the first one above.</p>
                        : notes.map((n) => (
                            <div key={n.id} className="flex gap-3">
                              <Avatar className="h-6 w-6 shrink-0"><AvatarFallback className="text-[10px]">{initials(n.author)}</AvatarFallback></Avatar>
                              <div>
                                <p className="text-sm"><span className="font-medium">{n.author}</span> {n.body}</p>
                                <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
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
  // Placeholder for a Google Maps "place embed" iframe / <GoogleMap> pinned + zoomed
  // to this lead's coordinates. Swap for:
  // <iframe src={`https://www.google.com/maps/embed/v1/place?key=${key}&q=${lat},${lng}`} />
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
