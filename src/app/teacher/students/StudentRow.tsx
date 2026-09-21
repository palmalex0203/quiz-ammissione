"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { resetStudentPassword, deleteStudent, type ActionState } from "./actions";

const initialState: ActionState = {};

export function StudentRow({
  student,
}: {
  student: { id: string; name: string; email: string; attemptCount: number; createdAt: string };
}) {
  const [showReset, setShowReset] = useState(false);
  const [state, formAction, isPending] = useActionState(resetStudentPassword, initialState);

  return (
    <div className="border-b border-zinc-100 py-3 last:border-b-0 dark:border-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            href={`/teacher/results/student/${student.id}`}
            className="text-sm font-semibold hover:text-brand-strong"
          >
            {student.name}
          </Link>
          <p className="text-xs text-muted">{student.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/teacher/results/student/${student.id}`}
            className="text-xs font-semibold text-muted hover:text-brand-strong"
          >
            {student.attemptCount} tentativi &middot; vedi risultati
          </Link>
          <button
            type="button"
            onClick={() => setShowReset((v) => !v)}
            className="text-xs font-semibold text-muted hover:text-brand-strong"
          >
            Reimposta password
          </button>
          <form action={deleteStudent}>
            <input type="hidden" name="studentId" value={student.id} />
            <button
              type="submit"
              className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Elimina
            </button>
          </form>
        </div>
      </div>

      {showReset && (
        <form action={formAction} className="mt-2 flex items-center gap-2">
          <input type="hidden" name="studentId" value={student.id} />
          <input
            type="text"
            name="password"
            placeholder="Nuova password"
            required
            minLength={6}
            className="field field-sm"
          />
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-sm btn-ink disabled:opacity-60"
          >
            {isPending ? "Salvataggio..." : "Salva"}
          </button>
          {state.error && <span className="text-xs text-red-600 dark:text-red-400">{state.error}</span>}
          {state.success && (
            <span className="text-xs text-green-600 dark:text-green-400">{state.success}</span>
          )}
        </form>
      )}
    </div>
  );
}
