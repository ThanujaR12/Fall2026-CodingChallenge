// Notifications as a full page (phones use this; desktop opens the side panel instead).
import { useEffect } from 'react';
import { PageContainer } from '@/components/PageContainer';
import { MarkAllReadButton } from '@/features/notifications/MarkAllReadButton';
import { NotificationList } from '@/features/notifications/NotificationList';
import { APP_NAME } from '@/lib/constants';

export function NotificationsPage() {
  useEffect(() => {
    document.title = `Notifications · ${APP_NAME}`;
  }, []);

  return (
    <PageContainer className="max-w-[640px] pt-6 md:pt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[34px]">Notifications</h1>
        <MarkAllReadButton />
      </div>
      <NotificationList />
    </PageContainer>
  );
}
