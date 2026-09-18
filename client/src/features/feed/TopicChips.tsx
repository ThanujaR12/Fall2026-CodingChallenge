// Row of topic chips above the feed (like Pinterest's board tabs); scrolls sideways on small screens.
import { FEED_TOPICS, type FeedTopic } from '@/lib/feedTopics';
import { cn } from '@/lib/utils';

type TopicChipsProps = { value: FeedTopic; onChange: (topic: FeedTopic) => void };

export function TopicChips({ value, onChange }: TopicChipsProps) {
  return (
    <nav
      aria-label="Topics"
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0"
    >
      <ul className="flex w-max gap-2">
        {FEED_TOPICS.map((topic) => {
          const active = topic.id === value;
          return (
            <li key={topic.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onChange(topic.id)}
                className={cn(
                  'inline-flex min-h-10 cursor-pointer items-center rounded-full px-4 text-[15px] font-semibold whitespace-nowrap transition-colors',
                  active ? 'bg-ink text-paper' : 'bg-surface text-ink hover:bg-neutral-200',
                )}
              >
                {topic.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
