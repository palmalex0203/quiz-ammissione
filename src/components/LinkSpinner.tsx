"use client";

import { useLinkStatus } from "next/link";

/**
 * Rotellina che compare dentro una voce di menu mentre la pagina sta arrivando.
 * Va usata dentro un <Link>: su rete lenta il precaricamento può non essere
 * pronto, e senza un segnale il clic sembra non aver fatto niente.
 */
export function LinkSpinner() {
  const { pending } = useLinkStatus();
  if (!pending) return null;

  return (
    <span
      aria-hidden="true"
      className="ml-auto h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60 motion-reduce:animate-none"
    />
  );
}
