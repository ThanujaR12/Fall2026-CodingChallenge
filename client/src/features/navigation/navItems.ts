// The app's main destinations, shared by the desktop sidebar and the phone bottom bar.
import {
  Bell,
  ChatCircleDots,
  Compass,
  House,
  PlusSquare,
  SquaresFour,
  type Icon,
} from '@phosphor-icons/react';

export type NavItem = { to: string; label: string; icon: Icon; end?: boolean };

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/collections', label: 'Boards', icon: SquaresFour },
  { to: '/create', label: 'Create', icon: PlusSquare },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/messages', label: 'Chat', icon: ChatCircleDots },
];
