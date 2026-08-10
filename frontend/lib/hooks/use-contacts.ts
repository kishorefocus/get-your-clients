import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  ContactCreateRequest,
  ContactUpdateRequest,
} from "@/lib/api/contacts";
import { toast } from "sonner";

export const CONTACT_KEYS = {
  all: ["contacts"] as const,
  list: (clientId: string) => ["contacts", "list", clientId] as const,
};

export function useContacts(clientId: string) {
  return useQuery({
    queryKey: CONTACT_KEYS.list(clientId),
    queryFn: () => listContacts(clientId),
    enabled: !!clientId,
  });
}

export function useCreateContact(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ContactCreateRequest) => createContact(clientId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTACT_KEYS.list(clientId) });
      toast.success("Contact created");
    },
    onError: (err: Error) => toast.error(`Create failed: ${err.message}`),
  });
}

export function useUpdateContact(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, payload }: { contactId: string; payload: ContactUpdateRequest }) =>
      updateContact(clientId, contactId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTACT_KEYS.list(clientId) });
      toast.success("Contact updated");
    },
    onError: (err: Error) => toast.error(`Update failed: ${err.message}`),
  });
}

export function useDeleteContact(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) => deleteContact(clientId, contactId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTACT_KEYS.list(clientId) });
      toast.success("Contact deleted");
    },
    onError: (err: Error) => toast.error(`Delete failed: ${err.message}`),
  });
}
