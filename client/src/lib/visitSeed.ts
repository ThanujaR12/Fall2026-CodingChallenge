// A random seed for this visit: the "For you" feed is reshuffled on every visit (and on Shuffle),
// while staying consistent as you scroll within one visit.
const KEY = 'pixboard.visitSeed';

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function visitSeed(): string {
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;
    const seed = randomSeed();
    sessionStorage.setItem(KEY, seed);
    return seed;
  } catch {
    return randomSeed();
  }
}

export function newVisitSeed(): string {
  const seed = randomSeed();
  try {
    sessionStorage.setItem(KEY, seed);
  } catch {
    // Without storage the new seed simply lasts for this page view.
  }
  return seed;
}
