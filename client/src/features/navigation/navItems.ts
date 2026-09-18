// The app's main destinations, shared by the desktop sidebar and the phone bottom bar.
import {
  Bell,
  Compass,
  House,
  Palette,
  PlusSquare,
  SquaresFour,
  type Icon,
} from '@phosphor-icons/react';

export type NavItem = {
  to: string;
  label: string;
  icon: Icon;
  end?: boolean;
  /** Palette Boards gets a rainbow ring so it stands out from the plain icons. */
  colorful?: boolean;
  /** On desktop this item opens the notifications panel instead of a page. */
  opensPanel?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/collections', label: 'Boards', icon: SquaresFour },
  { to: '/palettes', label: 'Palettes', icon: Palette, colorful: true },
  { to: '/create', label: 'Create', icon: PlusSquare },
  { to: '/notifications', label: 'Notifications', icon: Bell, opensPanel: true },
];
