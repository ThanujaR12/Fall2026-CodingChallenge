// Keyword field with photo and voice search, and a Search button; ignores empty submissions.
import { useState, type FormEvent } from 'react';
import { MagnifyingGlass, Microphone } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MAX_QUERY } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useVoiceSearch } from './useVoiceSearch';
import { VisualSearchDialog } from './VisualSearchDialog';

type SearchBarProps = { initialQuery: string; onSearch: (q: string) => void };

export function SearchBar({ initialQuery, onSearch }: SearchBarProps) {
  const [value, setValue] = useState(initialQuery);
  const voice = useVoiceSearch({
    onInterim: (text) => setValue(text.slice(0, MAX_QUERY)),
    // Speaking a phrase runs the search, just like pressing Search.
    onFinal: (text) => {
      const q = text.slice(0, MAX_QUERY).trim();
      setValue(q);
      if (q) onSearch(q);
    },
    onError: (message) => toast.error(message),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const q = value.trim();
    if (!q) return;
    onSearch(q);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex gap-2.5">
      <div className="relative flex-1">
        <label htmlFor="search-input" className="sr-only">
          Search images
        </label>
        <MagnifyingGlass
          size={18}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink/65"
          aria-hidden="true"
        />
        <Input
          id="search-input"
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={MAX_QUERY}
          placeholder={voice.listening ? 'Listening…' : 'Search for images, e.g. coastal fog'}
          className={cn(
            'min-h-11 pl-10 text-[16px] md:min-h-[42px]',
            voice.supported ? 'pr-20' : 'pr-12',
          )}
          autoComplete="off"
        />
        {/* Search with a photo, and by voice (hidden where the browser can't do speech). */}
        <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center">
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
                  : 'text-ink/70 hover:bg-surface hover:text-ink',
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
      </div>
      <Button type="submit" size="lg" className="min-h-11 md:min-h-[42px]">
        Search
      </Button>
    </form>
  );
}
