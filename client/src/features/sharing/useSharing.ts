// Data hooks for sharing: link on/off, invite, change role, remove, and leave.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  changeMemberRole,
  disableShare,
  enableShare,
  inviteMember,
  removeMember,
} from '@/api/sharing';
import { queryKeys } from '@/lib/queryKeys';
import type { CollectionDetail, MemberRole } from '@/types/api';

// Every sharing change refreshes this collection and the collection lists ("Shared with me").
function useRefresh(collectionId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.collection(collectionId) });
    void queryClient.invalidateQueries({ queryKey: ['collections'] });
  };
}

export function useShareLink(collectionId: string) {
  const queryClient = useQueryClient();
  const setToken = (shareToken: string | null) =>
    queryClient.setQueryData<CollectionDetail>(queryKeys.collection(collectionId), (current) =>
      current ? { ...current, shareToken } : current,
    );

  const enable = useMutation({
    mutationFn: () => enableShare(collectionId),
    onSuccess: (token) => setToken(token),
  });
  const disable = useMutation({
    mutationFn: () => disableShare(collectionId),
    onSuccess: () => setToken(null),
  });
  return { enable, disable };
}

export function useMembers(collectionId: string) {
  const refresh = useRefresh(collectionId);

  const invite = useMutation({
    mutationFn: (input: { usernameOrEmail: string; role: MemberRole }) =>
      inviteMember(collectionId, input),
    onSuccess: refresh,
  });
  const changeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: MemberRole }) =>
      changeMemberRole(collectionId, userId, role),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (userId: string) => removeMember(collectionId, userId),
    onSuccess: refresh,
  });
  return { invite, changeRole, remove };
}

export function useLeaveCollection(collectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (myUserId: string) => removeMember(collectionId, myUserId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.collection(collectionId) });
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}
