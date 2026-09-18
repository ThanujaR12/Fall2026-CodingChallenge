// The always-there search in the header. It knows where you are: on search results it shows what
// you searched; on a photo page it suggests that photo's subject.
import { matchPath, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { getPhoto } from '@/api/photos';
import { SearchBar } from './SearchBar';

export function HeaderSearch() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const onSearchPage = pathname === '/search';
  const q = onSearchPage ? (params.get('q') ?? '') : '';

  // Shares the photo page's cached details, so this costs no extra request.
  const photoId = matchPath('/photo/:sourceId', pathname)?.params.sourceId;
  const photo = useQuery({
    queryKey: ['photo', photoId],
    queryFn: () => getPhoto(photoId!),
    enabled: Boolean(photoId),
  });
  const subject = photoId ? photo.data?.photo.tags[0] : undefined;

  return (
    <SearchBar
      // A new page or a new query starts the field fresh (e.g. after browser Back).
      key={`${pathname}|${q}`}
      initialQuery={q}
      placeholder={subject ? `Search more like “${subject}”` : 'Search photos'}
      onSearch={(next) => navigate(`/search?${new URLSearchParams({ q: next })}`)}
    />
  );
}
