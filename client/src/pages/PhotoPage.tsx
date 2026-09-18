// A single photo, opened from any feed: large image with its colours, a details panel with Save and
// tags, and "More like this" that can match by subject or by colour (PixBoard's palette twist).
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight, ImageSquare, Palette, Shapes } from '@phosphor-icons/react';
import { ApiError } from '@/api/client';
import { getPhoto, getSimilarPhotos } from '@/api/photos';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageContainer } from '@/components/PageContainer';
import { PaletteStrip } from '@/components/PaletteStrip';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageFeed } from '@/features/feed/ImageFeed';
import { SaveToCollectionPopover } from '@/features/search/SaveToCollectionPopover';
import { APP_NAME } from '@/lib/constants';
import { IMAGE_COLORS, nearestImageColor } from '@/lib/colors';
import { cn } from '@/lib/utils';
import type { SearchResult, SimilarBy } from '@/types/api';

const renderSaveAction = (result: SearchResult) => (
  <SaveToCollectionPopover result={result} appearance="pin" />
);

function MoreLikeThis({
  sourceId,
  by,
  onBy,
}: {
  sourceId: string;
  by: SimilarBy;
  onBy: (b: SimilarBy) => void;
}) {
  const similar = useInfiniteQuery({
    queryKey: ['similar', sourceId, by],
    queryFn: ({ pageParam }) => getSimilarPhotos(sourceId, by, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore && last.page < 25 ? last.page + 1 : undefined),
    staleTime: 10 * 60_000,
  });
  const results = similar.data?.pages.flatMap((page) => page.results) ?? [];
  const first = similar.data?.pages[0];
  const colorLabel = IMAGE_COLORS.find((c) => c.id === first?.color)?.label;

  const option = (value: SimilarBy, label: string, Icon: typeof Shapes) => (
    <button
      type="button"
      aria-pressed={by === value}
      onClick={() => onBy(value)}
      className={cn(
        'inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold transition-colors',
        by === value ? 'bg-ink text-paper' : 'text-ink/80 hover:bg-neutral-200',
      )}
    >
      <Icon size={16} weight={by === value ? 'fill' : 'regular'} aria-hidden="true" />
      {label}
    </button>
  );

  return (
    <section aria-labelledby="more-like-this" className="mt-14">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="more-like-this" className="text-[26px]">
            More like this
          </h2>
          {first && first.basedOn.length > 0 && (
            <p className="mt-1 text-[13px] text-ink/70">
              Matching {first.basedOn.map((w) => `“${w}”`).join(' and ')}
              {colorLabel && ` in ${colorLabel.toLowerCase()} tones`}
            </p>
          )}
        </div>
        {/* PixBoard's twist: match what the photo shows, or the colours it's made of. */}
        <div
          role="group"
          aria-label="Match by"
          className="inline-flex gap-1 rounded-full bg-surface p-1"
        >
          {option('subject', 'Same subject', Shapes)}
          {option('color', 'Same colours', Palette)}
        </div>
      </div>
      {!similar.isPending && !similar.isError && results.length === 0 ? (
        <EmptyState
          icon={<ImageSquare size={34} weight="duotone" />}
          title="Nothing similar yet."
          body="Try the other match, or search for something close."
        />
      ) : (
        <ImageFeed
          key={`${sourceId}|${by}`}
          feed={{ ...similar, results, hasNextPage: similar.hasNextPage ?? false }}
          label={by === 'color' ? 'Photos in the same colours' : 'Photos with the same subject'}
          renderSaveAction={renderSaveAction}
        />
      )}
    </section>
  );
}

export function PhotoPage() {
  const { sourceId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const by: SimilarBy = params.get('by') === 'color' ? 'color' : 'subject';
  // The feed passes the photo along, so the page shows it instantly while details load.
  const fromFeed = (location.state as { photo?: SearchResult } | null)?.photo;
  const detail = useQuery({ queryKey: ['photo', sourceId], queryFn: () => getPhoto(sourceId) });
  const photo = detail.data?.photo ?? (fromFeed?.sourceId === sourceId ? fromFeed : undefined);
  const palette = detail.data?.palette ?? [];
  // Which large image has finished loading (so a new photo starts from its small version).
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const largeUrl = detail.data?.photo.largeUrl;
  const largeLoaded = Boolean(largeUrl) && loadedUrl === largeUrl;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [sourceId]);

  useEffect(() => {
    document.title = photo ? `${photo.title} · ${APP_NAME}` : `Photo · ${APP_NAME}`;
  }, [photo]);

  if (!photo && detail.isError) {
    const gone = detail.error instanceof ApiError && detail.error.status === 404;
    return (
      <PageContainer className="pt-10">
        {gone ? (
          <EmptyState
            icon={<ImageSquare size={34} weight="duotone" />}
            title="This photo is no longer available."
            body="Pixabay may have removed it. There's plenty more on Home."
          />
        ) : (
          <ErrorState
            title="Couldn't load this photo."
            message={detail.error.message}
            onRetry={() => detail.refetch()}
            isRetrying={detail.isRefetching}
          />
        )}
      </PageContainer>
    );
  }

  const leading = palette[0];
  const matchColor = leading
    ? IMAGE_COLORS.find((c) => c.id === nearestImageColor(leading))
    : undefined;

  return (
    <PageContainer className="max-w-[1400px] pt-4 md:pt-6">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        className="mb-4 inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[14px] font-semibold hover:bg-surface"
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Back
      </button>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
        <figure className="min-w-0">
          <div className="relative overflow-hidden rounded-3xl bg-surface">
            {photo ? (
              <>
                {/* The small version shows at once; the large one fades in over it. */}
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.title}
                  className="block h-auto w-full"
                  style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
                />
                {largeUrl && (
                  <img
                    src={largeUrl}
                    alt=""
                    aria-hidden="true"
                    onLoad={() => setLoadedUrl(largeUrl)}
                    className={cn(
                      'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
                      largeLoaded ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                )}
              </>
            ) : (
              <Skeleton className="aspect-[4/3] w-full" />
            )}
          </div>
          <figcaption className="mt-4">
            <p className="label-caps mb-2">Colours in this photo</p>
            {detail.isPending ? (
              <Skeleton className="h-14 w-full rounded-xl" />
            ) : (
              <PaletteStrip colors={palette} className="h-14 rounded-xl" />
            )}
          </figcaption>
        </figure>

        <aside className="grid gap-6 lg:sticky lg:top-24">
          {photo ? (
            <>
              <div>
                <h1 className="text-[32px] leading-tight break-words md:text-[40px]">
                  {photo.title}
                </h1>
                <p className="mt-2 text-[14px] text-ink/75">
                  Photo by <span className="font-semibold text-ink">{photo.creatorName}</span> on{' '}
                  <a
                    href={photo.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 underline"
                  >
                    Pixabay
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </a>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <SaveToCollectionPopover result={photo} appearance="pin" />
                <span className="text-[13px] text-ink/70">Keep it on one of your boards</span>
              </div>

              {photo.tags.length > 0 && (
                <div>
                  <p className="label-caps mb-2">Tags</p>
                  <ul className="flex flex-wrap gap-2">
                    {photo.tags.slice(0, 12).map((tag) => (
                      <li key={tag}>
                        <Link
                          to={`/search?${new URLSearchParams({ q: tag })}`}
                          className="inline-flex min-h-9 items-center rounded-full bg-surface px-3.5 text-[14px] hover:bg-neutral-200"
                        >
                          {tag}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {matchColor && (
                <Link
                  to={`/palettes?color=${matchColor.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-divider p-4 hover:bg-surface/70"
                >
                  <span
                    aria-hidden="true"
                    className="size-10 shrink-0 rounded-full border border-ink/15"
                    style={{ background: leading }}
                  />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold">
                      Mostly {matchColor.label.toLowerCase()}
                    </span>
                    <span className="block text-[13px] text-ink/70">
                      Browse more {matchColor.label.toLowerCase()} photos in Palettes
                    </span>
                  </span>
                </Link>
              )}
            </>
          ) : (
            <div className="grid gap-3" role="status" aria-label="Loading photo">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-11 w-32 rounded-full" />
            </div>
          )}
        </aside>
      </div>

      <MoreLikeThis
        sourceId={sourceId}
        by={by}
        onBy={(next) => setParams(next === 'subject' ? {} : { by: next }, { replace: true })}
      />
    </PageContainer>
  );
}
