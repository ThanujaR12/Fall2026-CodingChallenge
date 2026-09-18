// Home: a Pinterest-style board of popular photos, filtered by topic chips, with search on top.
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { PageContainer } from '@/components/PageContainer';
import { ImageFeed } from '@/features/feed/ImageFeed';
import { TopicChips } from '@/features/feed/TopicChips';
import { useFeed } from '@/features/feed/useFeed';
import { SaveToCollectionPopover } from '@/features/search/SaveToCollectionPopover';
import { SearchBar } from '@/features/search/SearchBar';
import { APP_NAME } from '@/lib/constants';
import { FEED_TOPICS, isFeedTopic, type FeedTopic } from '@/lib/feedTopics';
import type { SearchResult } from '@/types/api';

const renderSaveAction = (result: SearchResult) => (
  <SaveToCollectionPopover result={result} appearance="pin" />
);

export function HomePage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const raw = params.get('topic');
  const topic: FeedTopic = isFeedTopic(raw) ? raw : 'all';
  const feed = useFeed(topic);
  const label = FEED_TOPICS.find((t) => t.id === topic)?.label ?? 'All';

  useEffect(() => {
    document.title = topic === 'all' ? `Home · ${APP_NAME}` : `${label} · ${APP_NAME}`;
  }, [topic, label]);

  function changeTopic(next: FeedTopic) {
    setParams(next === 'all' ? {} : { topic: next });
    window.scrollTo({ top: 0 });
  }

  return (
    <PageContainer className="max-w-[1800px] pt-3 md:pt-4">
      <h1 className="sr-only">Home feed</h1>
      {/* Search and topics stay in reach while the board scrolls. */}
      <div className="sticky top-0 z-20 -mx-4 grid gap-3 bg-paper/95 px-4 pt-2 pb-4 backdrop-blur md:-mx-10 md:px-10">
        <SearchBar
          initialQuery=""
          onSearch={(q) => navigate(`/search?${new URLSearchParams({ q })}`)}
        />
        <TopicChips value={topic} onChange={changeTopic} />
      </div>
      <ImageFeed
        key={topic}
        feed={feed}
        label={topic === 'all' ? 'Popular photos' : `${label} photos`}
        renderSaveAction={renderSaveAction}
      />
    </PageContainer>
  );
}
