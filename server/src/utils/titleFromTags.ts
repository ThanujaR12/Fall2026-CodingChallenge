// Pixabay images have no title, so we build a readable one from their comma-separated tags.

export function splitTags(tags: string): string[] {
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export function titleFromTags(tags: string): string {
  const firstTwo = splitTags(tags).slice(0, 2).join(', ');
  if (!firstTwo) return 'Untitled photo';
  return firstTwo.charAt(0).toUpperCase() + firstTwo.slice(1);
}
