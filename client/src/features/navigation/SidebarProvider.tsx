// Runs the sidebar's show/hide rules: it peeks for a few seconds on arriving at Home, and stays
// open while the pointer or keyboard focus is on it, closing shortly after both leave.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { SidebarContext } from './useSidebar';

const CLOSE_DELAY_MS = 350;

export function SidebarProvider({ children }: { children: ReactNode }) {
  const { pathname, key } = useLocation();
  // The navigation (by its unique key) whose Home peek has finished.
  const [peekDoneFor, setPeekDoneFor] = useState<string | null>(null);
  const [hovered, setHoveredState] = useState(false);
  const [focused, setFocused] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  // Every arrival on Home shows the sidebar briefly; the Sidebar ends the peek once it has shown.
  const peeking = pathname === '/' && peekDoneFor !== key;

  // Opening is instant; closing waits a moment so a brief slip off the edge doesn't flicker it.
  const setHovered = useCallback((next: boolean) => {
    window.clearTimeout(closeTimer.current);
    if (next) setHoveredState(true);
    else closeTimer.current = window.setTimeout(() => setHoveredState(false), CLOSE_DELAY_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const value = useMemo(
    () => ({
      open: peeking || hovered || focused,
      setHovered,
      setFocused,
      finishPeek: setPeekDoneFor,
    }),
    [peeking, hovered, focused, setHovered],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
