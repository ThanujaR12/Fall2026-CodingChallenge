// Plain-language Privacy Policy and Terms of Use (linked from Google sign-in and the sign-in page).
import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router';
import { PageContainer } from '@/components/PageContainer';
import { APP_NAME } from '@/lib/constants';

const CONTACT_EMAIL = 'thanujarameshbaabu@gmail.com';
const UPDATED = 'September 18, 2026';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-[20px]">{title}</h2>
      <div className="mt-2 grid gap-2 text-[15px] leading-relaxed text-ink/85">{children}</div>
    </section>
  );
}

function Privacy() {
  return (
    <>
      <Section title="What we store">
        <p>
          Your account: username, email, and a securely hashed password (never the password itself).
          If you use Google sign-in, we receive only your name, email, and Google account id.
        </p>
        <p>
          What you create: your boards, the photos you save (a copy of each image, with its Pixabay
          credit), your titles and notes, your profile (display name, bio, avatar colour), who you
          share boards with, and board activity and notifications.
        </p>
      </Section>
      <Section title="What stays on your device">
        <p>
          Your sign-in token and recent searches are kept in your browser. “Search with a photo”
          reads the photo on your device; the photo is never uploaded. Only the words it finds are
          searched. Voice search uses your browser’s built-in speech recognition, which your browser
          may process with its own provider.
        </p>
      </Section>
      <Section title="Who else is involved">
        <p>
          Photo searches are sent to Pixabay to find images. The app is hosted on Vercel (website),
          Render (server), and MongoDB Atlas (database). We don’t use ads or analytics, and we never
          sell or share your information.
        </p>
      </Section>
      <Section title="Your choices">
        <p>
          You can edit your profile, delete boards and saved photos, turn share links off, and
          remove collaborators at any time. To delete your account and everything in it, email{' '}
          <a className="text-accent-deep underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>
    </>
  );
}

function Terms() {
  return (
    <>
      <Section title="Using PaletteBoard">
        <p>
          {APP_NAME} is a free student project (Change++ Fall 2026 coding challenge) for finding,
          saving, and sharing photos. Please use it kindly: don’t upload or share anything illegal
          or hurtful, and don’t try to access boards that aren’t shared with you.
        </p>
      </Section>
      <Section title="Photos">
        <p>
          Photos come from Pixabay and are used under the Pixabay Content License. Each one keeps
          its photographer’s credit and a link back to Pixabay.
        </p>
      </Section>
      <Section title="No guarantees">
        <p>
          The app is provided as-is, on free hosting that may sleep when idle, and it may change or
          stop at any time. Keep your own copies of anything important.
        </p>
      </Section>
      <Section title="Contact">
        <p>
          Questions:{' '}
          <a className="text-accent-deep underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>
    </>
  );
}

export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const title = kind === 'privacy' ? 'Privacy Policy' : 'Terms of Use';
  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
  }, [title]);

  return (
    <PageContainer className="max-w-[760px] pt-10">
      <p className="label-caps">{APP_NAME}</p>
      <h1 className="mt-2 text-[36px] md:text-[44px]">{title}</h1>
      <p className="mt-2 text-[14px] text-ink/70">Last updated {UPDATED}</p>
      {kind === 'privacy' ? <Privacy /> : <Terms />}
      <p className="mt-10 text-[14px] text-ink/75">
        See also the{' '}
        <Link
          className="text-accent-deep underline"
          to={kind === 'privacy' ? '/terms' : '/privacy'}
        >
          {kind === 'privacy' ? 'Terms of Use' : 'Privacy Policy'}
        </Link>
        .
      </p>
    </PageContainer>
  );
}
