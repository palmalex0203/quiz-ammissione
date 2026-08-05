"use client";

import { useActionState } from "react";
import { createTest, type ActionState } from "../actions";

const initialState: ActionState = {};

export default function NewTestPage() {
  const [state, formAction, isPending] = useActionState(createTest, initialState);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Nuovo test</h1>

      <form
        action={formAction}
        className="flex max-w-lg flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Titolo
          </label>
          <input
            id="title"
            name="title"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isPending ? "Creazione..." : "Crea e continua"}
        </button>
      </form>
    </div>
  );
}
