// Shown for unknown URLs, with a way back to search.
import { useEffect } from 'react';
import { Link } from 'react-router';
import { Compass } from '@phosphor-icons/react';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { buttonVariants } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';

export function NotFoundPage() {
  useEffect(() => {
    document.title = `Page not found · ${APP_NAME}`;
  }, []);

  return (
    <PageContainer>
      <EmptyState
        icon={<Compass size={34} weight="duotone" />}
        title="This page doesn't exist."
        body="The link may be old or mistyped."
        action={
          <Link to="/search" className={buttonVariants({ variant: 'primary' })}>
            Go to search
          </Link>
        }
      />
    </PageContainer>
  );
}
