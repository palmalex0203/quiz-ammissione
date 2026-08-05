"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveAnswer, submitAttempt } from "./actions";

type Question = {
  id: string;
  subject: string;
  text: string;
  options: { id: string; text: string }[];
};

export function TakeTestForm({
  testTitle,
  attemptId,
  timeLimitMinutes,
  startedAt,
  questions,
  initialAnswers,
}: {
  testTitle: string;
  attemptId: string;
  timeLimitMinutes: number | null;
  startedAt: string;
  questions: Question[];
  initialAnswers: Record<string, string>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [, startSaveTransition] = useTransition();
  const submittedRef = useRef(false);

  const deadline =
    timeLimitMinutes != null ? new Date(startedAt).getTime() + timeLimitMinutes * 60_000 : null;
  const [remainingMs, setRemainingMs] = useState(() => (deadline ? deadline - Date.now() : null));

  function doSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    startSubmitTransition(async () => {
      await submitAttempt(attemptId);
    });
  }

  useEffect(() => {
    if (deadline == null) return;
    const interval = setInterval(() => {
      const remaining = deadline - Date.now();
      setRemainingMs(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        doSubmit();
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline]);

  function selectOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    startSaveTransition(async () => {
      await saveAnswer(attemptId, questionId, optionId);
    });
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{testTitle}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {answeredCount}/{questions.length} risposte date
          </p>
        </div>
        {remainingMs != null && (
          <div
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              remainingMs < 60_000
                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {formatTime(remainingMs)}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {questions.map((q, index) => (
          <div
            key={q.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Domanda {index + 1} &middot; {q.subject}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{q.text}</p>
            <div className="mt-3 flex flex-col gap-2">
              {q.options.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    checked={answers[q.id] === option.id}
                    onChange={() => selectOption(q.id, option.id)}
                    className="h-4 w-4"
                  />
                  <span className="text-zinc-800 dark:text-zinc-200">{option.text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={doSubmit}
          disabled={isSubmitting}
          className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isSubmitting ? "Invio in corso..." : "Invia test"}
        </button>
        {answeredCount < questions.length && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {questions.length - answeredCount} domande senza risposta.
          </p>
        )}
      </div>
    </div>
  );
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
