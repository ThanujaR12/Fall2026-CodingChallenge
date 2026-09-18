// Topics for the home feed: each maps to the Pixabay filters that fill it.
export const FEED_TOPICS = {
  all: { editors_choice: 'true', order: 'popular' },
  nature: { category: 'nature', order: 'popular' },
  travel: { category: 'travel', order: 'popular' },
  food: { category: 'food', order: 'popular' },
  fashion: { category: 'fashion', order: 'popular' },
  animals: { category: 'animals', order: 'popular' },
  architecture: { category: 'buildings', order: 'popular' },
  interiors: { q: 'interior design', order: 'popular' },
  flowers: { q: 'flowers', order: 'popular' },
  cozy: { q: 'cozy', order: 'popular' },
  city: { q: 'city night', order: 'popular' },
  art: { q: 'art', order: 'popular' },
} as const satisfies Record<string, Record<string, string>>;

export type FeedTopic = keyof typeof FEED_TOPICS;

export const FEED_TOPIC_IDS = Object.keys(FEED_TOPICS) as [FeedTopic, ...FeedTopic[]];
