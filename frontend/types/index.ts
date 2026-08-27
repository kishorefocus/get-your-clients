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
  industryId?: string;
  isLocked?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: "Admin" | "Manager" | "Rep";
  avatarUrl?: string;
  email: string;
  online?: boolean;
  assignedLeads?: number;
  dealsWon?: number;
  joinedAt?: string;
}

export type MessageStatus = "sending" | "sent" | "delivered" | "read";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  status: MessageStatus;
  isMe: boolean;
  attachments?: { name: string; url: string; type: "file" | "image" }[];
}

export interface Conversation {
  id: string;
  leadId: string;
  leadName: string;
  leadAvatar?: string;
  leadCountry: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  assignedRep?: string;
}

export type CallDirection = "inbound" | "outbound";
export type CallOutcome = "answered" | "no-answer" | "voicemail" | "busy" | "failed";

export interface CallLog {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadCountry: string;
  direction: CallDirection;
  outcome: CallOutcome;
  durationSecs: number;
  timestamp: string;
  hasRecording: boolean;
  notes?: string;
  assignedRep: string;
}

export interface AnalyticsSeries {
  week: string;
  outreach: number;
  responses: number;
  deals: number;
}

export interface CountryMetric {
  country: string;
  code: string;
  leads: number;
  won: number;
}

export interface RepStat {
  id: string;
  name: string;
  avatarUrl?: string;
  dealsWon: number;
  outreachSent: number;
  responseRate: number;
  callsMade: number;
}

export interface FunnelStage {
  stage: PipelineStage;
  label: string;
  count: number;
  color: string;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  key?: string;
}
