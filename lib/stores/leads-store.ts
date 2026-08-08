import { create } from "zustand";
import { Lead, PipelineStage } from "@/types";
import { mockLeads } from "@/lib/mock/leads";

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
  notes: Record<string, Note[]>;
  activity: Record<string, ActivityEvent[]>;
  getLead: (id: string) => Lead | undefined;
  setStage: (id: string, stage: PipelineStage) => void;
  toggleSaved: (id: string) => void;
  addNote: (id: string, body: string, author?: string) => void;
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
  notes: seedNotes,
  activity: seedActivity,

  getLead: (id) => get().leads.find((l) => l.id === id),

  setStage: (id, stage) =>
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
    })),

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
