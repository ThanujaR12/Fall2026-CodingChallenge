// Placeholder for sidebar destinations that are planned but not built yet.
import { useEffect } from 'react';
import { Link } from 'react-router';
import type { Icon } from '@phosphor-icons/react';
import { EmptyState } from '@/components/EmptyState';
import { PageContainer } from '@/components/PageContainer';
import { buttonVariants } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';

type ComingSoonPageProps = { title: string; body: string; icon: Icon };

export function ComingSoonPage({ title, body, icon: Icon }: ComingSoonPageProps) {
  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
  }, [title]);

  return (
    <PageContainer className="pt-10 md:pt-16">
      <h1 className="mb-6 text-[34px] md:text-[42px]">{title}</h1>
      <EmptyState
        icon={<Icon size={34} weight="duotone" />}
        title="Coming soon."
        body={body}
        action={
          <Link to="/" className={buttonVariants({ variant: 'secondary' })}>
            Back to Home
          </Link>
        }
      />
    </PageContainer>
  );
}
