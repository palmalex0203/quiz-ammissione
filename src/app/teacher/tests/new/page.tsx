"use client";

import { useActionState } from "react";
import { createTest, type ActionState } from "../actions";
import { TrackField } from "@/components/TrackField";

const initialState: ActionState = {};

export default function NewTestPage() {
  const [state, formAction, isPending] = useActionState(createTest, initialState);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="page-title">Nuovo test</h1>

      <form
        action={formAction}
        className="flex max-w-lg flex-col gap-4 card p-6"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Titolo
          </label>
          <input
            id="title"
            name="title"
            required
            className="field"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Descrizione (opzionale)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="field"
          />
        </div>

        <TrackField />

        {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 btn btn-ink self-start disabled:opacity-60"
        >
          {isPending ? "Creazione..." : "Crea e continua"}
        </button>
      </form>
    </div>
  );
}
