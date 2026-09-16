// Keyword field and Search button; ignores empty submissions.
import { useState, type FormEvent } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MAX_QUERY } from '@/lib/constants';

type SearchBarProps = { initialQuery: string; onSearch: (q: string) => void };

export function SearchBar({ initialQuery, onSearch }: SearchBarProps) {
  const [value, setValue] = useState(initialQuery);

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
          placeholder="Search for images, e.g. coastal fog"
          className="min-h-11 pl-10 text-[16px] md:min-h-[42px]"
          autoComplete="off"
        />
      </div>
      <Button type="submit" size="lg" className="min-h-11 md:min-h-[42px]">
        Search
      </Button>
    </form>
  );
}
