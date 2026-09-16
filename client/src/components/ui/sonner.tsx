// shadcn/ui Toaster (sonner): toast notifications in Broadsheet paper, ink, and serif type.
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      toastOptions={{
        style: {
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
          border: 'none',
          borderRadius: '2px',
          fontFamily: 'var(--font-serif)',
          fontSize: '14px',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
