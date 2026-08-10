import { useQuery } from "@tanstack/react-query";
import { listAuditLogs, AuditLogFilters } from "@/lib/api/audit-logs";

export const AUDIT_LOG_KEYS = {
  all: ["audit-logs"] as const,
  list: (filters: AuditLogFilters) => ["audit-logs", "list", filters] as const,
};

export function useAuditLogs(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: AUDIT_LOG_KEYS.list(filters),
    queryFn: () => listAuditLogs(filters),
    staleTime: 5000,
  });
}
