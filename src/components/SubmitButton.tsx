"use client";

import { useFormStatus } from "react-dom";

/**
 * Pulsante di invio che si disabilita e mostra uno spinner mentre l'azione è in
 * corso. Generare una simulazione richiede qualche secondo: senza questo riscontro
 * gli studenti premevano più volte, creando decine di test doppi.
 *
 * Va usato dentro un <form>: useFormStatus legge lo stato del form che lo contiene.
 */
export function SubmitButton({
  children,
  pendingText = "Attendi…",
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className ?? ""} inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {pending && (
        <svg
          className="h-4 w-4 shrink-0 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
          />
        </svg>
      )}
      {pending ? pendingText : children}
    </button>
  );
}
