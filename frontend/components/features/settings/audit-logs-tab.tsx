"use client";

import { useState } from "react";
import { useAuditLogs } from "@/lib/hooks/use-audit-logs";
import { useAuth } from "@/lib/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerChild } from "@/lib/motion";
import { cn } from "@/lib/utils";

const ACTIONS = ["", "view", "create", "update", "delete", "search", "export"];
const RESOURCE_TYPES = ["", "client", "contact", "stage", "saved-search", "reminder"];

export function AuditLogsTab() {
  const { user } = useAuth();
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data, isLoading, refetch } = useAuditLogs({
    action: action || undefined,
    resource_type: resourceType || undefined,
    limit,
    offset,
  });

  const logs = data?.results || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  if (user?.role !== "admin") {
    return (
      <Card className="border-dashed border-border/80 max-w-xl">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Access Restricted</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Audit log auditing is restricted to administrative and compliance officers. Contact your organisation owner for admin privileges.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Action</label>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-md border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-ring"
            >
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a ? a.toUpperCase() : "ALL ACTIONS"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">Resource Type</label>
            <select
              value={resourceType}
              onChange={(e) => {
                setResourceType(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-md border border-border bg-background text-xs outline-none focus:ring-2 focus:ring-ring"
            >
              {RESOURCE_TYPES.map((r) => (
                <option key={r} value={r}>
                  {r ? r.toUpperCase() : "ALL TYPES"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="h-9 gap-1.5"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      <Card className="overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border/80">
                <th className="p-3 font-semibold text-muted-foreground uppercase tracking-wider">Timestamp</th>
                <th className="p-3 font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                <th className="p-3 font-semibold text-muted-foreground uppercase tracking-wider">Resource</th>
                <th className="p-3 font-semibold text-muted-foreground uppercase tracking-wider">Resource ID</th>
                <th className="p-3 font-semibold text-muted-foreground uppercase tracking-wider">Context Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          log.action === "delete"
                            ? "danger"
                            : log.action === "create"
                            ? "success"
                            : log.action === "update"
                            ? "accent"
                            : "default"
                        }
                        className="uppercase text-[9px] font-bold"
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3 font-medium capitalize">{log.resource_type}</td>
                    <td className="p-3 text-muted-foreground font-mono text-[10px] truncate max-w-[120px]">
                      {log.resource_id || "—"}
                    </td>
                    <td className="p-3 text-muted-foreground max-w-sm truncate" title={JSON.stringify(log.context)}>
                      {Object.keys(log.context).length > 0 ? JSON.stringify(log.context) : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                    No compliance logs matched the current search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing <strong className="text-foreground">{offset + 1}</strong> to{" "}
            <strong className="text-foreground">{Math.min(offset + limit, total)}</strong> of{" "}
            <strong className="text-foreground">{total}</strong> records
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-8 gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="h-8 gap-1"
            >
              Next <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
