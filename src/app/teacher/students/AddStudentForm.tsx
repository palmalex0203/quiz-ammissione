"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStudent, type ActionState } from "./actions";

const initialState: ActionState = {};

export function AddStudentForm() {
  const [state, formAction, isPending] = useActionState(createStudent, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 card p-5 sm:flex-row sm:items-end sm:flex-wrap"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Nome
        </label>
        <input
          id="name"
          name="name"
          required
          className="field"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="field"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Password iniziale
        </label>
        <input
          id="password"
          name="password"
          type="text"
          required
          minLength={6}
          className="field"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="btn btn-ink disabled:opacity-60"
      >
        {isPending ? "Creazione..." : "Aggiungi studente"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      {state.success && <p className="w-full text-sm text-green-600 dark:text-green-400">{state.success}</p>}
    </form>
  );
}
