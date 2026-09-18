// A friendly note while the API server wakes up: the free host sleeps when idle, so the first
// request after a quiet spell can take up to a minute. Shown only while a request is that slow.
import { useSyncExternalStore } from 'react';
import { isServerSlow, subscribeServerSlow } from '@/api/client';
import { LogoMark } from './Logo';

export function ServerWakeNotice() {
  const slow = useSyncExternalStore(subscribeServerSlow, isServerSlow);
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-8"
    >
      {slow && (
        <div className="animate-rise pointer-events-auto flex max-w-[460px] items-center gap-3 rounded-2xl border border-divider bg-white px-4 py-3 shadow-float">
          <LogoMark className="size-8 shrink-0 animate-pulse motion-reduce:animate-none" />
          <p className="text-[14px] leading-snug">
            <span className="font-semibold">Waking up the PaletteBoard server…</span>
            <br />
            <span className="text-ink/75">
              It naps when no one is using it (free hosting). This can take up to a minute.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
