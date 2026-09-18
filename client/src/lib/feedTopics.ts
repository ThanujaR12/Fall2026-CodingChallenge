// Home-feed topics shown as chips; ids match the server's GET /api/feed topics.
export const FEED_TOPICS = [
  { id: 'all', label: 'Popular' },
  { id: 'nature', label: 'Nature' },
  { id: 'travel', label: 'Travel' },
  { id: 'food', label: 'Food' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'interiors', label: 'Interiors' },
  { id: 'cozy', label: 'Cozy' },
  { id: 'flowers', label: 'Flowers' },
  { id: 'animals', label: 'Animals' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'city', label: 'City nights' },
  { id: 'art', label: 'Art' },
] as const;

export type FeedTopic = (typeof FEED_TOPICS)[number]['id'];

export function isFeedTopic(value: string | null): value is FeedTopic {
  return FEED_TOPICS.some((topic) => topic.id === value);
}
