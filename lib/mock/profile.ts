import { Lead } from "@/types";

export interface ContactPerson {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface AttachedFile {
  id: string;
  name: string;
  kind: "pdf" | "doc" | "image" | "sheet";
  size: string;
  uploadedAt: string;
}

const firstNames = ["Elif", "Wanjiru", "Lars", "Haruto", "Thandiwe", "Camila", "Sven", "Ligaya"];
const lastNames = ["Demir", "Njoroge", "Berg", "Sato", "Dlamini", "Reyes", "Andersson", "Cruz"];
const titles = ["Procurement Manager", "Head of Operations", "CEO", "Purchasing Director", "Business Development Lead"];

function seedIndex(id: string) {
  return id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

export function getContacts(lead: Lead): ContactPerson[] {
  const i = seedIndex(lead.id);
  const first = firstNames[i % firstNames.length];
  const last = lastNames[(i + 3) % lastNames.length];
  return [
    {
      id: `${lead.id}-c1`,
      name: `${first} ${last}`,
      title: titles[i % titles.length],
      email: lead.email ?? `${first.toLowerCase()}@${lead.website ?? "example.com"}`,
      phone: lead.phone ?? "+1 555 000 0000",
      isPrimary: true,
    },
    {
      id: `${lead.id}-c2`,
      name: `${firstNames[(i + 2) % firstNames.length]} ${lastNames[(i + 5) % lastNames.length]}`,
      title: "Finance Contact",
      email: `finance@${lead.website ?? "example.com"}`,
      phone: lead.phone ?? "+1 555 000 0001",
      isPrimary: false,
    },
  ];
}

export function getFiles(lead: Lead): AttachedFile[] {
  return [
    { id: `${lead.id}-f1`, name: "Company profile.pdf", kind: "pdf", size: "1.2 MB", uploadedAt: "2026-07-30T11:00:00Z" },
    { id: `${lead.id}-f2`, name: "Pricing proposal — draft.docx", kind: "doc", size: "340 KB", uploadedAt: "2026-08-02T09:15:00Z" },
    { id: `${lead.id}-f3`, name: "Site photos.zip", kind: "image", size: "8.4 MB", uploadedAt: "2026-08-04T16:40:00Z" },
  ];
}
