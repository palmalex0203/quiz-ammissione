"use client";

import { useState } from "react";
import { deleteQuestion, moveQuestion, updateQuestion } from "./actions";
import { QuestionForm } from "./QuestionForm";
import { EmptyState } from "@/components/EmptyState";

type QuestionData = {
  id: string;
  subject: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  text: string;
  order: number;
  options: { id: string; text: string; isCorrect: boolean }[];
};

export function QuestionList({ testId, questions }: { testId: string; questions: QuestionData[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (questions.length === 0) {
    return (
      <EmptyState
        icon="✏️"
        title="Nessuna domanda ancora"
        description="Aggiungi la prima domanda con il modulo qui sopra."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {questions.map((q, index) => (
        <div
          key={q.id}
          className="card p-4"
        >
          {editingId === q.id ? (
            <QuestionForm
              testId={testId}
              action={updateQuestion}
              submitLabel="Salva modifiche"
              onDone={() => setEditingId(null)}
              initial={{
                questionId: q.id,
                subject: q.subject,
                type: q.type,
                text: q.text,
                options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
              }}
            />
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {q.subject} &middot; {q.type === "MULTIPLE_CHOICE" ? "Scelta multipla" : "Vero/Falso"}
                </p>
                <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{q.text}</p>
                <ul className="mt-2 flex flex-col gap-0.5">
                  {q.options.map((o) => (
                    <li
                      key={o.id}
                      className={`text-xs ${
                        o.isCorrect
                          ? "font-medium text-green-700 dark:text-green-400"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {o.isCorrect ? "✓ " : "— "}
                      {o.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="flex gap-2">
                  <form action={moveQuestion}>
                    <input type="hidden" name="testId" value={testId} />
                    <input type="hidden" name="questionId" value={q.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      type="submit"
                      disabled={index === 0}
                      className="text-xs text-zinc-500 hover:text-zinc-900 disabled:opacity-30 dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveQuestion}>
                    <input type="hidden" name="testId" value={testId} />
                    <input type="hidden" name="questionId" value={q.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={index === questions.length - 1}
                      className="text-xs text-zinc-500 hover:text-zinc-900 disabled:opacity-30 dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                      ↓
                    </button>
                  </form>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingId(q.id)}
                  className="text-xs font-semibold text-muted hover:text-brand-strong"
                >
                  Modifica
                </button>
                <form action={deleteQuestion}>
                  <input type="hidden" name="testId" value={testId} />
                  <input type="hidden" name="questionId" value={q.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Elimina
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
