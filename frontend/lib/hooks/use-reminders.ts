import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  ReminderCreateRequest,
  ReminderUpdateRequest,
} from "@/lib/api/reminders";
import { toast } from "sonner";

export const REMINDER_KEYS = {
  all: ["reminders"] as const,
  list: (dueSoon?: boolean) => ["reminders", "list", dueSoon ? "dueSoon" : "all"] as const,
};

export function useReminders(dueSoon?: boolean) {
  return useQuery({
    queryKey: REMINDER_KEYS.list(dueSoon),
    queryFn: () => listReminders(dueSoon),
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createReminder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REMINDER_KEYS.all });
      toast.success("Reminder added");
    },
    onError: (err: Error) => toast.error(`Add reminder failed: ${err.message}`),
  });
}

export function useUpdateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReminderUpdateRequest }) =>
      updateReminder(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REMINDER_KEYS.all });
    },
    onError: (err: Error) => toast.error(`Update failed: ${err.message}`),
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteReminder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REMINDER_KEYS.all });
      toast.success("Reminder deleted");
    },
    onError: (err: Error) => toast.error(`Delete failed: ${err.message}`),
  });
}
