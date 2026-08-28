import { useQuery } from "@tanstack/react-query";
import { getDashboardOverview, getDashboardAnalytics } from "@/lib/api/dashboard";

export const DASHBOARD_KEYS = {
  overview: ["dashboard", "overview"] as const,
  analytics: ["dashboard", "analytics"] as const,
};

export function useDashboardOverview() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.overview,
    queryFn: getDashboardOverview,
    staleTime: 30_000,
  });
}

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.analytics,
    queryFn: getDashboardAnalytics,
    staleTime: 30_000,
  });
}
