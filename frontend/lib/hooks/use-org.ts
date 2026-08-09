import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyOrg, listMembers, inviteMember, InviteUserRequest } from "@/lib/api/orgs";
import { toast } from "sonner";

export const ORG_KEYS = {
  me: ["org", "me"] as const,
  members: ["org", "members"] as const,
};

/** Fetch the current user's organization. */
export function useMyOrg() {
  return useQuery({
    queryKey: ORG_KEYS.me,
    queryFn: getMyOrg,
    staleTime: 60_000,
  });
}

/** Fetch all members in the current org. */
export function useOrgMembers() {
  return useQuery({
    queryKey: ORG_KEYS.members,
    queryFn: listMembers,
    staleTime: 60_000,
  });
}

/** Invite a new member to the org. */
export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteUserRequest) => inviteMember(payload),
    onSuccess: (newMember) => {
      qc.invalidateQueries({ queryKey: ORG_KEYS.members });
      toast.success(`${newMember.email} invited successfully`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
