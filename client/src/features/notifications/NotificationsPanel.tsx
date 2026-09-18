// Desktop notifications panel: slides out beside the sidebar (like Pinterest's), closes with the X,
// Escape, or a click elsewhere, and keeps the sidebar open while it is showing.
import { useRef } from 'react';
import { Dialog } from 'radix-ui';
import { X } from '@phosphor-icons/react';
import { useSidebar } from '@/features/navigation/useSidebar';
import { MarkAllReadButton } from './MarkAllReadButton';
import { NotificationList } from './NotificationList';

export function NotificationsPanel() {
  const { panelOpen, setPanelOpen } = useSidebar();
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog.Root open={panelOpen} onOpenChange={setPanelOpen} modal={false}>
      <Dialog.Portal>
        <Dialog.Content
          ref={contentRef}
          tabIndex={-1}
          aria-describedby={undefined}
          // Focus the panel itself (not the close button) so no ring flashes on open.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            contentRef.current?.focus();
          }}
          // Clicking the bell again should toggle, not close-then-reopen.
          onInteractOutside={(event) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest('[data-notifications-trigger]')) event.preventDefault();
          }}
          className="fixed inset-y-0 left-[76px] z-40 flex w-[min(430px,calc(100vw-76px))] flex-col border-r border-divider bg-paper shadow-[10px_0_32px_rgba(32,30,29,0.12)] outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-left-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-left-4 motion-reduce:animate-none"
        >
          <div className="flex items-center justify-between px-6 pt-7 pb-3">
            <Dialog.Title className="text-[28px] font-semibold">Notifications</Dialog.Title>
            <Dialog.Close
              aria-label="Close notifications"
              className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full hover:bg-surface"
            >
              <X size={22} />
            </Dialog.Close>
          </div>
          <div className="flex justify-end px-5">
            <MarkAllReadButton />
          </div>
          <div className="flex-1 overflow-y-auto px-6 pt-2 pb-8">
            <NotificationList onNavigate={() => setPanelOpen(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
