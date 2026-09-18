// Notifications for the signed-in user, refreshed every 30 seconds; marking read updates instantly.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications';
import type { NotificationsResponse } from '@/types/api';

const KEY = ['notifications'] as const;

export function useNotifications() {
  return useQuery({
    queryKey: KEY,
    queryFn: listNotifications,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

// Shows the change right away and rolls back if the server refuses it.
function useOptimisticRead<T>(
  mutationFn: (arg: T) => Promise<void>,
  apply: (data: NotificationsResponse, arg: T) => NotificationsResponse,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (arg: T) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<NotificationsResponse>(KEY);
      if (previous) queryClient.setQueryData(KEY, apply(previous, arg));
      return { previous };
    },
    onError: (_error, _arg, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMarkRead() {
  return useOptimisticRead<string>(markNotificationRead, (data, id) => {
    const target = data.notifications.find((n) => n.id === id);
    if (!target || target.read) return data;
    return {
      notifications: data.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, data.unreadCount - 1),
    };
  });
}

export function useMarkAllRead() {
  return useOptimisticRead<void>(markAllNotificationsRead, (data) => ({
    notifications: data.notifications.map((n) => ({ ...n, read: true })),
    unreadCount: 0,
  }));
}
