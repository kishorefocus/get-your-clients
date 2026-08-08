import { AnalyticsSeries, CountryMetric, RepStat, FunnelStage } from "@/types";

export const weeklyPerformance: AnalyticsSeries[] = [
  { week: "W22", outreach: 68, responses: 14, deals: 3 },
  { week: "W23", outreach: 82, responses: 21, deals: 4 },
  { week: "W24", outreach: 74, responses: 18, deals: 5 },
  { week: "W25", outreach: 91, responses: 26, deals: 6 },
  { week: "W26", outreach: 105, responses: 31, deals: 8 },
  { week: "W27", outreach: 97, responses: 28, deals: 7 },
  { week: "W28", outreach: 118, responses: 35, deals: 9 },
  { week: "W29", outreach: 124, responses: 38, deals: 11 },
  { week: "W30", outreach: 109, responses: 29, deals: 8 },
  { week: "W31", outreach: 132, responses: 44, deals: 13 },
  { week: "W32", outreach: 141, responses: 48, deals: 15 },
  { week: "W33", outreach: 156, responses: 54, deals: 17 },
];

export const countryMetrics: CountryMetric[] = [
  { country: "Turkey", code: "TR", leads: 412, won: 48 },
  { country: "Japan", code: "JP", leads: 387, won: 61 },
  { country: "Sweden", code: "SE", leads: 298, won: 44 },
  { country: "Philippines", code: "PH", leads: 274, won: 32 },
  { country: "South Africa", code: "ZA", leads: 231, won: 27 },
  { country: "Netherlands", code: "NL", leads: 198, won: 22 },
  { country: "Mexico", code: "MX", leads: 176, won: 19 },
  { country: "Kenya", code: "KE", leads: 143, won: 14 },
];

export const repStats: RepStat[] = [
  { id: "tm2", name: "Marcus L.", dealsWon: 31, outreachSent: 284, responseRate: 34.5, callsMade: 89 },
  { id: "tm6", name: "Yuki M.", dealsWon: 28, outreachSent: 251, responseRate: 31.2, callsMade: 74 },
  { id: "tm3", name: "Aylin K.", dealsWon: 22, outreachSent: 196, responseRate: 28.1, callsMade: 63 },
  { id: "tm4", name: "Priya S.", dealsWon: 17, outreachSent: 168, responseRate: 24.4, callsMade: 51 },
  { id: "tm5", name: "Tomás E.", dealsWon: 9, outreachSent: 124, responseRate: 19.7, callsMade: 38 },
];

export const funnelData: FunnelStage[] = [
  { stage: "new", label: "New", count: 842, color: "hsl(228 100% 57%)" },
  { stage: "contacted", label: "Contacted", count: 594, color: "hsl(228 80% 50%)" },
  { stage: "responded", label: "Responded", count: 318, color: "hsl(37 86% 58%)" },
  { stage: "negotiating", label: "Negotiating", count: 164, color: "hsl(37 70% 48%)" },
  { stage: "won", label: "Won", count: 121, color: "hsl(160 71% 33%)" },
  { stage: "lost", label: "Lost", count: 43, color: "hsl(358 75% 59%)" },
];

export const conversionRate = Math.round((121 / 842) * 100 * 10) / 10;
export const avgResponseRate = Math.round((318 / 594) * 100 * 10) / 10;
