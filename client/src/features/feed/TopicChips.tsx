// Row of chips above the Home feed (like Pinterest's board tabs): For you, your boards, then
// Popular and the topics.
// Scrolls sideways on small screens.
import { assetUrl } from '@/api/client';
import { FEED_TOPICS, type FeedTopic } from '@/lib/feedTopics';
import { cn } from '@/lib/utils';
import type { CollectionSummary } from '@/types/api';

type TopicChipsProps = {
  /** The chosen topic, or null while For you or a board is chosen. */
  topic: FeedTopic | null;
  forYou: boolean;
  onForYou: () => void;
  boardId: string | null;
  boards: CollectionSummary[];
  onTopic: (topic: FeedTopic) => void;
  onBoard: (boardId: string) => void;
};

const chip = (active: boolean) =>
  cn(
    'inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-[15px] font-semibold whitespace-nowrap transition-colors',
    active ? 'bg-ink text-paper' : 'bg-surface text-ink hover:bg-neutral-200',
  );

export function TopicChips({
  topic,
  forYou,
  onForYou,
  boardId,
  boards,
  onTopic,
  onBoard,
}: TopicChipsProps) {
  return (
    <nav
      aria-label="Topics and your boards"
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0"
    >
      <ul className="flex w-max items-center gap-2">
        <li>
          <button type="button" aria-pressed={forYou} onClick={onForYou} className={chip(forYou)}>
            For you
          </button>
        </li>

        {/* Your boards come right after For you so they are always in view. */}
        {boards.length > 0 && (
          <li aria-hidden="true" className="mx-1 flex items-center gap-2 pl-1">
            <span className="text-[13px] font-semibold whitespace-nowrap text-ink/65">
              Your boards
            </span>
          </li>
        )}
        {boards.map((board) => {
          const active = board.id === boardId;
          return (
            <li key={board.id}>
              <button
                type="button"
                aria-pressed={active}
                aria-label={`Ideas for your board ${board.name}`}
                onClick={() => onBoard(board.id)}
                className={cn(chip(active), 'pl-1.5')}
              >
                {/* The board's cover, or its leading colour while it has no photos. */}
                <span
                  aria-hidden="true"
                  className="stripe-placeholder inline-flex size-7 shrink-0 overflow-hidden rounded-full ring-2 ring-paper"
                  style={board.palette[0] ? { backgroundColor: board.palette[0] } : undefined}
                >
                  {board.coverImageUrl && (
                    <img
                      src={assetUrl(board.coverImageUrl)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </span>
                {board.name}
              </button>
            </li>
          );
        })}
        <li aria-hidden="true" className="mx-1 flex items-center">
          <span className="h-6 w-px bg-divider" />
        </li>
        {FEED_TOPICS.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              aria-pressed={t.id === topic}
              onClick={() => onTopic(t.id)}
              className={chip(t.id === topic)}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
