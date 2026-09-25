"use client";

import { useActionState } from "react";
import { updateNote, type ActionState } from "../actions";

const initialState: ActionState = {};

export function NoteEditor({ topic, title, body }: { topic: string; title: string; body: string }) {
  const [state, formAction, isPending] = useActionState(updateNote, initialState);

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-6">
      <input type="hidden" name="topic" value={topic} />

      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Titolo
        </label>
        <input id="title" name="title" defaultValue={title} required className="field" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="body" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Testo dell&apos;appunto
        </label>
        <textarea
          id="body"
          name="body"
          defaultValue={body}
          rows={28}
          spellCheck
          className="field font-mono text-xs leading-relaxed"
        />
        <p className="text-xs text-muted">
          Si scrive in markdown: <code>## Titolo</code> per un capitolo, <code>**grassetto**</code>,{" "}
          <code>- elenco</code>, <code>&gt; riquadro</code>. L&apos;anteprima qui sotto si aggiorna dopo il
          salvataggio.
        </p>
      </div>

      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      {state.salvato && !state.error && (
        <p className="text-sm text-green-700 dark:text-green-400">Salvato.</p>
      )}

      <button type="submit" disabled={isPending} className="btn btn-ink self-start disabled:opacity-60">
        {isPending ? "Salvataggio…" : "Salva l'appunto"}
      </button>
    </form>
  );
}
