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
  /** Up to five dominant colors ("#RRGGBB"), most prominent first; [] for an empty board. */
  palette: string[];
  /** Public boards are listed on Explore and viewable by anyone. */
  visibility: Visibility;
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
  /** Who saved it (null only for very old data). */
  addedBy: PublicUser | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = { id: string; username: string };

export type AuthUser = PublicUser & { email: string };

export type AuthResponse = { token: string; user: AuthUser };

export type Role = 'owner' | 'editor' | 'viewer';

export type MemberRole = 'editor' | 'viewer';

export type Member = { user: PublicUser; role: MemberRole };

export type SharedCollectionSummary = CollectionSummary & { owner: PublicUser; role: MemberRole };

export type CollectionsResponse = {
  collections: CollectionSummary[];
  shared: SharedCollectionSummary[];
};

export type CollectionDetail = CollectionSummary & {
  items: SavedItem[];
  role: Role;
  owner: PublicUser;
  members: Member[];
  /** Only filled in for the owner. */
  shareToken: string | null;
};

/** What anyone with a share link sees. */
export type SharedView = CollectionSummary & { owner: PublicUser; items: SavedItem[] };

export type Visibility = 'private' | 'public';

export type RecommendationsResponse = SearchResponse & { basedOn: string[] };

export type SimilarBy = 'subject' | 'color';

export type PhotoResponse = { photo: SearchResult & { largeUrl: string }; palette: string[] };

export type SimilarResponse = SearchResponse & {
  by: SimilarBy;
  basedOn: string[];
  color: string | null;
};

export type BoardActivityEntry = {
  id: string;
  type: 'item_added' | 'item_edited' | 'item_removed' | 'member_invited';
  actor: PublicUser | null;
  itemTitle: string;
  imageUrl: string | null;
  target: PublicUser | null;
  role: MemberRole | null;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  type: 'item_added' | 'item_edited' | 'item_removed' | 'member_invited';
  actor: PublicUser | null;
  collection: { id: string; name: string };
  itemTitle: string;
  imageUrl: string | null;
  role: MemberRole | null;
  read: boolean;
  createdAt: string;
};

export type NotificationsResponse = { notifications: AppNotification[]; unreadCount: number };

export type CollectionInput = { name: string; description: string; visibility?: Visibility };

export type ExploreBoard = CollectionSummary & { owner: PublicUser };

export type ExploreResponse = {
  boards: ExploreBoard[];
  page: number;
  perPage: number;
  total: number;
  hasMore: boolean;
};

export type ItemChanges = { title?: string; note?: string };

export type ApiErrorBody = {
  error: { code: string; message: string; fields?: Record<string, string> };
};
