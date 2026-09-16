// Converts database documents and Pixabay hits into the exact JSON shapes the API promises.
import type { PixabayHit } from '../services/pixabayService.js';
import { splitTags, titleFromTags } from './titleFromTags.js';

export function toSearchResult(hit: PixabayHit) {
  return {
    sourceId: String(hit.id),
    title: titleFromTags(hit.tags),
    tags: splitTags(hit.tags),
    creatorName: hit.user,
    pageUrl: hit.pageURL,
    thumbnailUrl: hit.webformatURL,
    width: hit.webformatWidth,
    height: hit.webformatHeight,
  };
}
