// Whether the auto-hiding sidebar is showing, shared so the header can swap its logo.
import { createContext, useContext } from 'react';

export type SidebarState = {
  open: boolean;
  /** Pointer or keyboard focus is on the sidebar (or the left-edge hot zone). */
  setHovered: (hovered: boolean) => void;
  setFocused: (focused: boolean) => void;
  /** Ends the arrival peek for this navigation (by its location key). */
  finishPeek: (locationKey: string) => void;
  /** The notifications panel beside the sidebar. */
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
};

export const SidebarContext = createContext<SidebarState>({
  open: false,
  setHovered: () => {},
  setFocused: () => {},
  finishPeek: () => {},
  panelOpen: false,
  setPanelOpen: () => {},
});

export function useSidebar(): SidebarState {
  return useContext(SidebarContext);
}
