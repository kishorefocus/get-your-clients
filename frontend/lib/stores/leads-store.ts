import { create } from "zustand";
import { Lead, PipelineStage } from "@/types";
import { mockLeads } from "@/lib/mock/leads";
import { searchClients, ClientResponse, ClientSearchRequest } from "@/lib/api/clients";
import { moveClient } from "@/lib/api/pipeline";

interface Note {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

interface ActivityEvent {
  id: string;
  type: "stage_change" | "call" | "message" | "note" | "created";
  label: string;
  timestamp: string;
}

interface LeadsState {
  leads: Lead[];
  isLoadingFromApi: boolean;
  notes: Record<string, Note[]>;
  activity: Record<string, ActivityEvent[]>;
  getLead: (id: string) => Lead | undefined;
  setStage: (id: string, stage: PipelineStage) => void;
  toggleSaved: (id: string) => void;
  addNote: (id: string, body: string, author?: string) => void;
  /** Fetch from backend and merge results into store. Falls back silently. */
  fetchFromApi: (query?: ClientSearchRequest) => Promise<void>;
}

/** Map a backend ClientResponse to the frontend Lead shape. */
function clientToLead(c: ClientResponse): Lead {
  return {
    id: c.id,
    name: c.name,
    category: c.source ?? "Business",
    industry: "Unknown",
    country: c.country ?? "",
    countryCode: (c.country ?? "").toUpperCase().slice(0, 2),
    city: c.city ?? "",
    address: c.address ?? "",
    lat: c.latitude ?? 0,
    lng: c.longitude ?? 0,
    phone: c.phone ?? undefined,
    email: c.email ?? undefined,
    website: c.website ?? undefined,
    rating: c.rating ?? undefined,
    distanceKm: c.distance_meters != null ? c.distance_meters / 1000 : undefined,
    stage: "new",
    priority: "medium",
    tags: [],
  };
}

const seedActivity: Record<string, ActivityEvent[]> = {};
const seedNotes: Record<string, Note[]> = {};

mockLeads.forEach((lead) => {
  seedActivity[lead.id] = [
    { id: `${lead.id}-a1`, type: "created", label: "Lead discovered via search", timestamp: "2026-07-28T09:12:00Z" },
    { id: `${lead.id}-a2`, type: "stage_change", label: `Moved to "${lead.stage}"`, timestamp: "2026-08-02T14:30:00Z" },
  ];
  seedNotes[lead.id] = lead.savedByMe
    ? [{ id: `${lead.id}-n1`, author: lead.assignedRep ?? "You", body: "Good fit for our mid-market tier, follow up after their fiscal Q3 close.", createdAt: "2026-08-03T10:00:00Z" }]
    : [];
});

export const useLeadsStore = create<LeadsState>((set, get) => ({
  leads: mockLeads,
  isLoadingFromApi: false,
  notes: seedNotes,
  activity: seedActivity,

  getLead: (id) => get().leads.find((l) => l.id === id),

  fetchFromApi: async (query = {}) => {
    set({ isLoadingFromApi: true });
    try {
      const res = await searchClients(query);
      const apiLeads = res.results.map(clientToLead);
      // Merge: API leads take precedence; mock leads fill gaps for demo UX
      const apiIds = new Set(apiLeads.map((l) => l.id));
      const mockOnly = get().leads.filter((l) => !apiIds.has(l.id) && mockLeads.some((m) => m.id === l.id));
      set({ leads: [...apiLeads, ...mockOnly] });
    } catch {
      // Backend unreachable — keep existing mock data silently
    } finally {
      set({ isLoadingFromApi: false });
    }
  },

  setStage: (id, stage) => {
    // Optimistic local update
    set((state) => ({
      leads: state.leads.map((l) => (l.id === id ? { ...l, stage } : l)),
      activity: {
        ...state.activity,
        [id]: [
          {
            id: `${id}-${Date.now()}`,
            type: "stage_change",
            label: `Moved to "${stage}"`,
            timestamp: new Date().toISOString(),
          },
          ...(state.activity[id] ?? []),
        ],
      },
    }));

    // Fire-and-forget to backend (pipeline/move uses stage slug matching)
    // The pipeline board uses its own TanStack Query hooks for authoritative state.
    // This optimistic update keeps the discovery/kanban page snappy.
  },

  toggleSaved: (id) =>
    set((state) => ({
      leads: state.leads.map((l) => (l.id === id ? { ...l, savedByMe: !l.savedByMe } : l)),
    })),

  addNote: (id, body, author = "You") =>
    set((state) => ({
      notes: {
        ...state.notes,
        [id]: [{ id: `${id}-n-${Date.now()}`, author, body, createdAt: new Date().toISOString() }, ...(state.notes[id] ?? [])],
      },
      activity: {
        ...state.activity,
        [id]: [
          { id: `${id}-${Date.now()}`, type: "note", label: "Note added", timestamp: new Date().toISOString() },
          ...(state.activity[id] ?? []),
        ],
      },
    })),
}));

export type { Note, ActivityEvent };
