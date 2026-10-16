"use client";

import { useState } from "react";
import { ALL_TRACKS, TRACKS, type TrackId } from "@/lib/tracks";

/**
 * Selettore del percorso: mostra quello aperto e permette di passare all'altro.
 * Sta nella barra laterale ("dark") e, su schermo piccolo, nella barra in alto
 * ("light"). Il menu si chiude da solo quando il fuoco esce dal gruppo, così
 * funziona anche da tastiera.
 *
 * L'azione arriva da fuori perché lo stesso selettore serve a due aree con due
 * permessi diversi: quella dello studente scrive la sua scelta e ricarica le
 * sue pagine, quella dell'insegnante le sue. Importarne una qui dentro
 * vorrebbe dire far chiamare a un insegnante un'azione che pretende di essere
 * uno studente.
 */
export function TrackSwitcher({
  current,
  action,
  tone = "light",
}: {
  current: TrackId;
  action: (formData: FormData) => void | Promise<void>;
  tone?: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const track = TRACKS[current];
  const dark = tone === "dark";

  // Il menu si richiude quando il percorso è cambiato davvero. Non si può chiudere
  // al click: il form verrebbe smontato prima che l'invio parta.
  const [shown, setShown] = useState(current);
  if (shown !== current) {
    setShown(current);
    setOpen(false);
  }

  return (
    <div
      className={`relative ${dark ? "" : "shrink-0"}`}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 text-left transition-colors ${
          dark
            ? "w-full justify-between rounded-2xl border border-sidebar-line bg-white/5 px-3 py-2 hover:bg-white/10"
            : "rounded-full border border-line bg-brand-tint px-3 py-1.5 hover:border-brand/40"
        }`}
      >
        <span className="flex min-w-0 flex-col leading-tight">
          <span
            className={`text-[0.625rem] font-semibold uppercase tracking-wider ${
              dark ? "text-sidebar-muted" : "text-muted"
            }`}
          >
            Percorso
          </span>
          <span className="truncate text-sm font-semibold">
            <span className={dark ? "" : "hidden sm:inline"}>{track.label}</span>
            {!dark && <span className="sm:hidden">{track.short}</span>}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`text-xs transition-transform ${dark ? "text-sidebar-muted" : "text-muted"} ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {/* Sempre nel documento, solo nascosto: un form smontato non invia nulla. */}
      <div
        role="menu"
        hidden={!open}
        className="card absolute left-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden p-1 text-foreground shadow-xl"
      >
        {ALL_TRACKS.map((t) => {
          const active = t.id === current;
          return (
            <form key={t.id} action={action}>
              <input type="hidden" name="track" value={t.id} />
              <button
                type="submit"
                role="menuitem"
                className={`flex w-full flex-col gap-0.5 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                  active ? "bg-brand-soft" : "hover:bg-brand-tint"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {t.label}
                  {active && (
                    <span aria-hidden="true" className="text-brand-strong">
                      ✓
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted">{t.tagline}</span>
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
