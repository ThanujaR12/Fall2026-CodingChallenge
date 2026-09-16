// TypeScript shapes of every API request and response (mirrors server/API.md).

export type SearchResult = {
  sourceId: string;
  title: string;
  tags: string[];
  creatorName: string;
  pageUrl: string;
  /** Temporary Pixabay URL: fine for showing search results, never stored. */
  thumbnailUrl: string;
  width: number;
  height: number;
};

export type SearchResponse = {
  results: SearchResult[];
  page: number;
  perPage: number;
  total: number;
  hasMore: boolean;
};

export type CollectionSummary = {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  coverImageUrl: string | null;
  coverCreatorName: string | null;
  coverPageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  /** Present only when collections are listed for a specific image. */
  containsImage?: boolean;
};

export type SavedItem = {
  id: string;
  collectionId: string;
  sourceId: string;
  title: string;
  note: string;
  tags: string[];
  creatorName: string;
  pageUrl: string;
  imageUrl: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
};

export type CollectionDetail = CollectionSummary & { items: SavedItem[] };

export type CollectionInput = { name: string; description: string };

export type ItemChanges = { title?: string; note?: string };

export type ApiErrorBody = {
  error: { code: string; message: string; fields?: Record<string, string> };
};
