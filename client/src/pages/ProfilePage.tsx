// Your profile: a header themed by your colour signature (every board's palette blended), an avatar
// ringed in your colours, stats, and tabs for everything you've saved, your boards, and boards
// shared with you. The chosen tab lives in the URL (?tab=saved|boards|shared).
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  Palette,
  Plus,
  SignOut,
  SquaresFour,
  BookmarkSimple,
  UsersThree,
} from '@phosphor-icons/react';
import { assetUrl } from '@/api/client';
import { getProfile, listSaved } from '@/api/profile';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageContainer } from '@/components/PageContainer';
import { PaletteStrip } from '@/components/PaletteStrip';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/useAuth';
import { CollectionCard } from '@/features/collections/CollectionCard';
import { useCollections } from '@/features/collections/useCollections';
import { ImageFeed } from '@/features/feed/ImageFeed';
import { BoardHero } from '@/features/palettes/BoardHero';
import { EditProfileDialog } from '@/features/profile/EditProfileDialog';
import { APP_NAME } from '@/lib/constants';
import { IMAGE_COLORS, nearestImageColor } from '@/lib/colors';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/types/api';

type Tab = 'saved' | 'boards' | 'shared';

// Each saved photo shows the board it lives on (instead of a Save button).
function SavedOnBoard({
  result,
}: {
  result: SearchResult & { board?: { id: string; name: string } | null };
}) {
  if (!result.board) return null;
  return (
    <Link
      to={`/collections/${result.board.id}`}
      className="inline-flex min-h-9 max-w-[160px] items-center gap-1.5 rounded-full bg-white/90 px-3 text-[13px] font-semibold text-ink hover:bg-white"
    >
      <SquaresFour size={14} aria-hidden="true" />
      <span className="truncate">{result.board.name}</span>
    </Link>
  );
}

function SavedTab() {
  const saved = useInfiniteQuery({
    queryKey: queryKeys.profileSaved,
    queryFn: ({ pageParam }) => listSaved(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
  // The feed tiles expect search-result shaped photos; saved ones map across directly.
  const results = (saved.data?.pages.flatMap((p) => p.items) ?? []).map((item) => ({
    sourceId: item.sourceId,
    title: item.title,
    tags: item.tags,
    creatorName: item.creatorName,
    pageUrl: item.pageUrl,
    thumbnailUrl: assetUrl(item.imageUrl),
    width: item.width || 4,
    height: item.height || 3,
    board: item.board,
  }));

  if (!saved.isPending && !saved.isError && results.length === 0) {
    return (
      <EmptyState
        icon={<BookmarkSimple size={34} weight="duotone" />}
        title="Nothing saved yet."
        body="Tap Save on any photo and it will show up here, on its board."
        action={
          <Link to="/" className={buttonVariants({ variant: 'primary' })}>
            Find photos
          </Link>
        }
      />
    );
  }
  return (
    <ImageFeed
      feed={{ ...saved, results, hasNextPage: saved.hasNextPage ?? false }}
      label="Everything you've saved"
      renderSaveAction={(result) => <SavedOnBoard result={result} />}
    />
  );
}

function BoardsTab({ shared }: { shared: boolean }) {
  const collections = useCollections();
  if (collections.isPending) {
    return (
      <div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        role="status"
        aria-label="Loading boards"
      >
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="aspect-[16/12] rounded-xl" />
        ))}
      </div>
    );
  }
  const list = shared ? (collections.data?.shared ?? []) : (collections.data?.collections ?? []);
  if (shared && list.length === 0) {
    return (
      <EmptyState
        icon={<UsersThree size={34} weight="duotone" />}
        title="No shared boards yet."
        body="When someone invites you to their board, it appears here."
      />
    );
  }
  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {!shared && (
        <li>
          <Link
            to="/create"
            className="flex aspect-[16/10] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-divider text-[15px] font-semibold text-ink/75 hover:border-accent hover:bg-accent-tint hover:text-accent-deep"
          >
            <Plus size={24} aria-hidden="true" />
            Create board
          </Link>
        </li>
      )}
      {list.map((board) => (
        <li key={board.id}>
          <CollectionCard collection={board} />
        </li>
      ))}
    </ul>
  );
}

export function ProfilePage() {
  const { logout } = useAuth();
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: Tab = raw === 'boards' || raw === 'shared' ? raw : 'saved';
  const profile = useQuery({ queryKey: queryKeys.profile, queryFn: getProfile });

  useEffect(() => {
    document.title = `My profile · ${APP_NAME}`;
  }, []);

  if (profile.isPending) {
    return (
      <PageContainer className="pt-10">
        <div className="flex items-center gap-5" role="status" aria-label="Loading profile">
          <Skeleton className="size-24 rounded-full" />
          <div className="grid gap-2">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </PageContainer>
    );
  }
  if (profile.isError) {
    return (
      <PageContainer className="pt-10">
        <ErrorState
          title="Couldn't load your profile."
          message={profile.error.message}
          onRetry={() => profile.refetch()}
          isRetrying={profile.isRefetching}
        />
      </PageContainer>
    );
  }

  const { user, stats, colorSignature } = profile.data;
  const name = user.displayName || user.username;
  const mainColor = colorSignature[0]
    ? IMAGE_COLORS.find((c) => c.id === nearestImageColor(colorSignature[0]))
    : undefined;
  const joined = user.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'saved', label: 'Saved', count: stats.savedPhotos },
    { id: 'boards', label: 'Boards', count: stats.boards },
    { id: 'shared', label: 'Shared with you', count: stats.sharedWithYou },
  ];

  return (
    <PageContainer className="max-w-[1800px]">
      {/* The page takes on your colour signature, just like a board takes on its palette. */}
      <BoardHero palette={colorSignature}>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <Avatar
              name={name}
              color={user.avatarColor}
              ring={colorSignature}
              className="size-24 shrink-0 text-[30px] md:size-28"
            />
            <div className="min-w-0">
              <h1 className="truncate text-[32px] leading-tight md:text-[44px]">{name}</h1>
              <p className="text-[14px] text-ink/75">
                @{user.username}
                {joined && ` · Joined ${joined}`}
              </p>
              <p
                className={cn('mt-2 max-w-[560px] text-[15px]', !user.bio && 'text-ink/70 italic')}
              >
                {user.bio || 'No bio yet. Add one so collaborators know what you collect.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <EditProfileDialog profile={profile.data} />
            <Button variant="ghost" onClick={logout}>
              <SignOut size={16} aria-hidden="true" />
              Log out
            </Button>
          </div>
        </div>

        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
          {[
            ['Boards', stats.boards],
            ['Saved photos', stats.savedPhotos],
            ['Collaborators', stats.collaborators],
            ['Shared with you', stats.sharedWithYou],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[13px] text-ink/75">{label}</dt>
              <dd className="text-[24px] font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </BoardHero>

      <section
        aria-labelledby="signature"
        className="mb-10 grid gap-3 rounded-2xl border border-divider p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
      >
        <div>
          <h2 id="signature" className="flex items-center gap-2 text-[20px]">
            <Palette size={20} weight="fill" aria-hidden="true" className="text-accent2" />
            Your colour signature
          </h2>
          <p className="mt-1 mb-3 text-[14px] text-ink/75">
            {colorSignature.length > 0
              ? `Every board's palette, blended into yours.${mainColor ? ` Mostly ${mainColor.label.toLowerCase()}.` : ''}`
              : 'Save photos to your boards and your signature colours will appear here.'}
          </p>
          <PaletteStrip colors={colorSignature} className="h-12 max-w-[520px] rounded-xl" />
        </div>
        {mainColor && (
          <Link
            to={`/palettes?color=${mainColor.id}`}
            className={buttonVariants({ variant: 'secondary' })}
          >
            <Palette size={16} aria-hidden="true" />
            Find photos in your colours
          </Link>
        )}
      </section>

      <div
        role="tablist"
        aria-label="Your things"
        className="mb-6 flex gap-1 border-b border-divider"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams(t.id === 'saved' ? {} : { tab: t.id }, { replace: true })}
            className={cn(
              '-mb-px inline-flex min-h-11 cursor-pointer items-center gap-2 border-b-2 px-4 text-[15px] font-semibold transition-colors',
              tab === t.id
                ? 'border-ink text-ink'
                : 'border-transparent text-ink/65 hover:text-ink',
            )}
          >
            {t.label}
            <span className="rounded-full bg-surface px-2 text-[12px] text-ink/75">{t.count}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'saved' && <SavedTab />}
        {tab === 'boards' && <BoardsTab shared={false} />}
        {tab === 'shared' && <BoardsTab shared />}
      </div>
    </PageContainer>
  );
}
