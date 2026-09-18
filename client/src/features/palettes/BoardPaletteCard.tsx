// One board's palette: cover, name, copyable swatches, and copy / download / find-more actions.
import { Link } from 'react-router';
import { Copy, DownloadSimple, MagnifyingGlass } from '@phosphor-icons/react';
import { assetUrl } from '@/api/client';
import { PaletteStrip } from '@/components/PaletteStrip';
import { Button } from '@/components/ui/button';
import { imageCount } from '@/lib/format';
import { copyPalette, downloadPalette } from '@/lib/palette';
import type { CollectionSummary } from '@/types/api';

type BoardPaletteCardProps = {
  board: CollectionSummary;
  /** "Yours", or whose board it is for shared ones. */
  ownerLabel: string;
  onFindMore: (board: CollectionSummary) => void;
};

export function BoardPaletteCard({ board, ownerLabel, onFindMore }: BoardPaletteCardProps) {
  const hasColors = board.palette.length > 0;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-divider bg-surface/60 p-4">
      <div className="flex items-center gap-3">
        <div className="stripe-placeholder size-12 shrink-0 overflow-hidden rounded-lg">
          {board.coverImageUrl && (
            <img
              src={assetUrl(board.coverImageUrl)}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-semibold">
            <Link
              to={`/collections/${board.id}`}
              className="hover:text-accent-deep hover:underline"
            >
              {board.name}
            </Link>
          </h3>
          <p className="text-[13px] text-ink/65">
            {imageCount(board.itemCount)} · {ownerLabel}
          </p>
        </div>
      </div>

      <PaletteStrip colors={board.palette} />

      {hasColors ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => copyPalette(board.palette)}>
            <Copy size={15} aria-hidden="true" />
            Copy all
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadPalette(board.name, board.palette)}
          >
            <DownloadSimple size={15} aria-hidden="true" />
            Download
          </Button>
          <Button size="sm" onClick={() => onFindMore(board)}>
            <MagnifyingGlass size={15} aria-hidden="true" />
            Find more like this
          </Button>
        </div>
      ) : (
        <p className="text-[13px] text-ink/65">Save photos to this board to see its colors.</p>
      )}
    </article>
  );
}
