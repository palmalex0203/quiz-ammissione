"use client";

import { useActionState } from "react";
import { updateTestSettings, type ActionState } from "./actions";
import { TrackField } from "@/components/TrackField";

const initialState: ActionState = {};

export function TestSettingsForm({
  test,
}: {
  test: {
    id: string;
    title: string;
    description: string | null;
    shuffleQuestions: boolean;
    track: string;
    timeLimitMinutes: number | null;
    maxAttempts: number | null;
  };
}) {
  const [state, formAction, isPending] = useActionState(updateTestSettings, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 card p-6"
    >
      <input type="hidden" name="testId" value={test.id} />

      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Titolo
        </label>
        <input
          id="title"
          name="title"
          defaultValue={test.title}
          required
          className="field"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Descrizione
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={test.description ?? ""}
          rows={2}
          className="field"
        />
      </div>

      <TrackField value={test.track} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="timeLimitMinutes" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Limite di tempo (minuti, opzionale)
          </label>
          <input
            id="timeLimitMinutes"
            name="timeLimitMinutes"
            type="number"
            min={1}
            defaultValue={test.timeLimitMinutes ?? ""}
            className="field"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="maxAttempts" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Numero massimo di tentativi (opzionale)
          </label>
          <input
            id="maxAttempts"
            name="maxAttempts"
            type="number"
            min={1}
            defaultValue={test.maxAttempts ?? ""}
            className="field"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          name="shuffleQuestions"
          defaultChecked={test.shuffleQuestions}
          className="h-4 w-4"
        />
        Mescola l&apos;ordine delle domande per ogni studente
      </label>

      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="btn btn-ink self-start disabled:opacity-60"
      >
        {isPending ? "Salvataggio..." : "Salva impostazioni"}
      </button>
    </form>
  );
}
