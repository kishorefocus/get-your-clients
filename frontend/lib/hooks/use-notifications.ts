import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listNotifications,
  readAllNotifications,
  readNotification,
} from "@/lib/api/notifications";
import { toast } from "sonner";

export const NOTIFICATION_KEYS = {
  all: ["notifications"] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.all,
    queryFn: listNotifications,
  });
}

export function useReadAllNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: readAllNotifications,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
      toast.success("All notifications marked as read");
    },
    onError: (err: Error) => toast.error(`Failed to mark read: ${err.message}`),
  });
}

export function useReadNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: readNotification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
    onError: (err: Error) => toast.error(`Failed to mark read: ${err.message}`),
  });
}
