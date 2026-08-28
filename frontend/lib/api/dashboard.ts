import { apiFetch } from "./client";
import { AnalyticsSeries, CountryMetric, RepStat, FunnelStage } from "@/types";

export interface DashboardOverviewResponse {
  kpis: {
    label: string;
    rawValue: number;
    display: string;
    delta: string;
    spark: number[];
  }[];
  activity: {
    id: string;
    name: string;
    city: string;
    country: string;
    category: string;
    lat: number;
    lng: number;
    countryCode: string;
    stage: string;
  }[];
  top_countries: {
    country: string;
    pct: number;
  }[];
}

export interface DashboardAnalyticsResponse {
  kpis: {
    label: string;
    rawValue: number;
    display: string;
    delta: string;
  }[];
  weeklyPerformance: AnalyticsSeries[];
  countryMetrics: CountryMetric[];
  repStats: RepStat[];
  funnelData: FunnelStage[];
}

export async function getDashboardOverview(): Promise<DashboardOverviewResponse> {
  return apiFetch<DashboardOverviewResponse>("/api/v1/dashboard/overview");
}

export async function getDashboardAnalytics(): Promise<DashboardAnalyticsResponse> {
  return apiFetch<DashboardAnalyticsResponse>("/api/v1/dashboard/analytics");
}
