// Home: "For you" by default (a feed that learns from what you save, fresh every visit), with your
// boards and the topics in the same chip row (Popular, Nature…); search is in the header.
import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { PageContainer } from '@/components/PageContainer';
import { ForYouFeed } from '@/features/feed/ForYouFeed';
import { ImageFeed } from '@/features/feed/ImageFeed';
import { TopicChips } from '@/features/feed/TopicChips';
import { useCollections } from '@/features/collections/useCollections';
import { BoardIdeas } from '@/features/palettes/BoardIdeas';
import { useFeed } from '@/features/feed/useFeed';
import { SaveToCollectionPopover } from '@/features/search/SaveToCollectionPopover';
import { APP_NAME } from '@/lib/constants';
import { FEED_TOPICS, isFeedTopic, type FeedTopic } from '@/lib/feedTopics';
import type { SearchResult } from '@/types/api';

const renderSaveAction = (result: SearchResult) => (
  <SaveToCollectionPopover result={result} appearance="pin" />
);

export function HomePage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('topic');
  // No topic (and no board) in the address means the personal "For you" feed.
  const topic: FeedTopic | null = isFeedTopic(raw) ? raw : null;
  const collections = useCollections();
  // Boards you can add to: your own, then shared ones where you're an editor.
  const boards = [
    ...(collections.data?.collections ?? []),
    ...(collections.data?.shared ?? []).filter((b) => b.role === 'editor'),
  ];
  const board = boards.find((b) => b.id === params.get('board')) ?? null;
  const feed = useFeed(topic ?? 'all', null, Boolean(topic) && !board);
  const label = FEED_TOPICS.find((t) => t.id === topic)?.label ?? 'For you';

  useEffect(() => {
    document.title = board
      ? `Ideas for ${board.name} · ${APP_NAME}`
      : topic
        ? `${label} · ${APP_NAME}`
        : `Home · ${APP_NAME}`;
  }, [board, topic, label]);

  function changeTopic(next: FeedTopic) {
    setParams({ topic: next });
    window.scrollTo({ top: 0 });
  }

  function showForYou() {
    setParams({});
    window.scrollTo({ top: 0 });
  }

  function chooseBoard(id: string) {
    setParams({ board: id });
    window.scrollTo({ top: 0 });
  }

  return (
    <PageContainer className="max-w-[1800px] pt-3 md:pt-4">
      <h1 className="sr-only">Home feed</h1>
      {/* Topics and your boards stay pinned just under the header while the board scrolls. */}
      <div className="sticky top-16 z-20 -mx-4 bg-paper/95 px-4 pt-1 pb-4 backdrop-blur md:-mx-10 md:px-10">
        <TopicChips
          topic={board ? null : topic}
          forYou={!board && !topic}
          onForYou={showForYou}
          boardId={board?.id ?? null}
          boards={boards}
          onTopic={changeTopic}
          onBoard={chooseBoard}
        />
      </div>
      {board ? (
        <div className="-mt-10">
          <BoardIdeas
            key={board.id}
            boardId={board.id}
            boardName={board.name}
            canAdd
            title={<>Ideas for {board.name}</>}
            showOpenLink
          />
        </div>
      ) : topic ? (
        <ImageFeed
          key={topic}
          feed={feed}
          label={topic === 'all' ? 'Popular photos' : `${label} photos`}
          renderSaveAction={renderSaveAction}
        />
      ) : (
        <ForYouFeed />
      )}
    </PageContainer>
  );
}
