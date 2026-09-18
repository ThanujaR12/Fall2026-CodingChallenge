// Magenta-tinted error box used on the sign-in forms and share dialog (design 01 and 05).
import { WarningCircle } from '@phosphor-icons/react';

export function FormError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 border-l-2 border-accent2 bg-accent2-tint px-3.5 py-2.5 text-[14px] text-accent2-deep"
    >
      <WarningCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
