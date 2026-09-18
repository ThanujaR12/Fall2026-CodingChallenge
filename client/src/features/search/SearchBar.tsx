// The search field in the header: type, speak, or use a photo; recent searches appear when it's
// empty and focused; "/" jumps into it from anywhere and Escape leaves it.
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ClockCounterClockwise, MagnifyingGlass, Microphone, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { MAX_QUERY } from '@/lib/constants';
import { addRecentSearch, clearRecentSearches, getRecentSearches } from '@/lib/recentSearches';
import { cn } from '@/lib/utils';
import { useVoiceSearch } from './useVoiceSearch';
import { VisualSearchDialog } from './VisualSearchDialog';

type SearchBarProps = {
  initialQuery: string;
  onSearch: (q: string) => void;
  placeholder?: string;
};

// Typing "/" anywhere (outside another field) focuses search, as on many sites.
function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(
    el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)),
  );
}

export function SearchBar({ initialQuery, onSearch, placeholder }: SearchBarProps) {
  const [value, setValue] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const listId = useId();

  function run(q: string) {
    const query = q.slice(0, MAX_QUERY).trim();
    if (!query) return;
    addRecentSearch(query);
    setValue(query);
    setFocused(false);
    inputRef.current?.blur();
    onSearch(query);
  }

  const voice = useVoiceSearch({
    onInterim: (text) => setValue(text.slice(0, MAX_QUERY)),
    // Speaking a phrase runs the search, just like pressing Enter.
    onFinal: (text) => run(text),
    onError: (message) => toast.error(message),
  });

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    run(value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setFocused(false);
      inputRef.current?.blur();
    }
  }

  const showRecent = focused && value.trim() === '' && recent.length > 0;

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="relative w-full"
      // Closes the recent list once focus leaves the whole search area.
      onBlur={(event) => {
        if (!wrapperRef.current?.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div ref={wrapperRef} className="relative">
        <label htmlFor={inputId} className="sr-only">
          Search images
        </label>
        <MagnifyingGlass
          size={18}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink/65"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={value}
          enterKeyHint="search"
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => {
            setRecent(getRecentSearches());
            setFocused(true);
          }}
          onKeyDown={handleKeyDown}
          maxLength={MAX_QUERY}
          placeholder={voice.listening ? 'Listening…' : (placeholder ?? 'Search photos')}
          aria-controls={showRecent ? listId : undefined}
          aria-expanded={showRecent}
          autoComplete="off"
          className={cn(
            'min-h-11 w-full rounded-full border border-transparent bg-surface pl-10 text-[16px] text-ink outline-none placeholder:text-ink/60 hover:bg-neutral-200/70 focus:border-accent focus:bg-paper [&::-webkit-search-cancel-button]:hidden',
            voice.supported ? 'pr-[7.5rem]' : 'pr-20',
          )}
        />
        {/* Clear, then search with a photo and by voice (hidden where speech isn't supported). */}
        <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center">
          {value && !voice.listening && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setValue('');
                inputRef.current?.focus();
              }}
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-ink/60 hover:bg-paper hover:text-ink"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
          <VisualSearchDialog />
          {voice.supported && (
            <button
              type="button"
              onClick={voice.listening ? voice.stop : voice.start}
              aria-pressed={voice.listening}
              aria-label={voice.listening ? 'Stop listening' : 'Search by voice'}
              title={voice.listening ? 'Stop listening' : 'Search by voice'}
              className={cn(
                'inline-flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors',
                voice.listening
                  ? 'bg-accent2 text-white motion-safe:animate-pulse'
                  : 'text-ink/70 hover:bg-paper hover:text-ink',
              )}
            >
              <Microphone
                size={19}
                weight={voice.listening ? 'fill' : 'regular'}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
        <span className="sr-only" aria-live="polite">
          {voice.listening ? 'Listening. Say what you want to see.' : ''}
        </span>

        {showRecent && (
          <div
            id={listId}
            className="absolute inset-x-0 top-full z-50 mt-2 rounded-2xl border border-divider bg-paper p-2 shadow-[0_12px_32px_rgba(32,30,29,0.14)]"
          >
            <div className="flex items-center justify-between px-2 py-1">
              <p className="label-caps">Recent searches</p>
              <button
                type="button"
                onClick={() => {
                  clearRecentSearches();
                  setRecent([]);
                  inputRef.current?.focus();
                }}
                className="cursor-pointer rounded-full px-2 py-1 text-[13px] font-semibold text-accent-deep hover:bg-accent-tint"
              >
                Clear
              </button>
            </div>
            <ul>
              {recent.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => run(q)}
                    className="flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 text-left text-[15px] hover:bg-surface"
                  >
                    <ClockCounterClockwise size={16} className="text-ink/60" aria-hidden="true" />
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </form>
  );
}
