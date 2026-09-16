// A tiny in-memory cache whose entries expire after a fixed time and whose size is capped.
export class TtlCache<K, V> {
  private entries = new Map<K, { value: V; expiresAt: number }>();

  constructor(
    private ttlMs: number,
    private maxSize: number,
  ) {}

  get(key: K): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: K, value: V): void {
    // Re-inserting moves the key to the end, so the first key is always the oldest.
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    if (this.entries.size > this.maxSize) {
      const oldestKey = this.entries.keys().next().value as K;
      this.entries.delete(oldestKey);
    }
  }
}
