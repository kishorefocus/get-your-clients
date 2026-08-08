export type PipelineStage = "new" | "contacted" | "responded" | "negotiating" | "won" | "lost";

export interface Lead {
  id: string;
  name: string;
  logoUrl?: string;
  category: string;
  industry: string;
  country: string;
  countryCode: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  companySize?: string;
  distanceKm?: number;
  stage: PipelineStage;
  priority: "low" | "medium" | "high";
  savedByMe?: boolean;
  nextFollowUp?: string;
  assignedRep?: string;
  tags: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: "Admin" | "Manager" | "Rep";
  avatarUrl?: string;
  email: string;
}
