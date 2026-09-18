// Pinterest-style masonry: each item drops into the shortest column, keeping its own shape.
// Items are absolutely positioned so the DOM (and keyboard/screen-reader) order stays feed order,
// and appending a page never moves the items already on screen.
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

type MasonryGridProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  /** Image height ÷ width. */
  getRatio: (item: T) => number;
  /** Fixed height of everything under the image (title, credit). */
  captionHeight: number;
  renderItem: (item: T, imageHeight: number) => ReactNode;
  label: string;
};

const GAP = 16;

function columnsFor(width: number): number {
  if (width < 520) return 2;
  if (width < 860) return 3;
  if (width < 1180) return 4;
  if (width < 1500) return 5;
  return 6;
}

export function MasonryGrid<T>({
  items,
  getKey,
  getRatio,
  captionHeight,
  renderItem,
  label,
}: MasonryGridProps<T>) {
  const containerRef = useRef<HTMLUListElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columns = columnsFor(width);
  const gap = width < 520 ? 10 : GAP;
  const columnWidth = width > 0 ? (width - gap * (columns - 1)) / columns : 0;
  const heights = new Array<number>(columns).fill(0);

  // Paged sources can repeat a photo across pages; show each one once.
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const placed = unique.map((item) => {
    // Clamp very tall or very wide photos so no single tile dominates the board.
    const ratio = Math.min(Math.max(getRatio(item) || 1, 0.6), 1.8);
    const imageHeight = Math.round(columnWidth * ratio);
    const column = heights.indexOf(Math.min(...heights));
    const top = heights[column];
    heights[column] += imageHeight + captionHeight + gap;
    return { item, imageHeight, left: column * (columnWidth + gap), top };
  });

  return (
    <ul
      ref={containerRef}
      aria-label={label}
      className="relative w-full"
      style={{ height: Math.max(0, Math.max(...heights) - gap) }}
    >
      {width > 0 &&
        placed.map(({ item, imageHeight, left, top }) => (
          <li
            key={getKey(item)}
            className="absolute"
            style={{ width: columnWidth, transform: `translate(${left}px, ${top}px)` }}
          >
            {renderItem(item, imageHeight)}
          </li>
        ))}
    </ul>
  );
}
