"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { clearAnswer, saveAnswer, submitAttempt } from "./actions";

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

  function deselectOption(questionId: string) {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    startSaveTransition(async () => {
      await clearAnswer(attemptId, questionId);
    });
  }

  const answeredCount = Object.keys(answers).length;
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-30 -mx-4 flex flex-col gap-3 border-b border-line bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold tracking-tight sm:text-2xl">{testTitle}</h1>
            <p className="text-sm text-muted">
              {answeredCount} di {questions.length} risposte date
              <span className="hidden sm:inline"> · tocca di nuovo una risposta per toglierla</span>
            </p>
          </div>
          {remainingMs != null && (
            <div
              role="timer"
              aria-label="Tempo rimanente"
              className={`shrink-0 rounded-full px-3.5 py-1.5 font-display text-sm font-bold tabular-nums ${
                remainingMs < 5 * 60_000
                  ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                  : "bg-card text-foreground ring-1 ring-line"
              }`}
            >
              {formatTime(remainingMs)}
            </div>
          )}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-brand-soft" aria-hidden="true">
          <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {questions.map((q, index) => {
          const answered = answers[q.id] != null;
          return (
            <fieldset key={q.id} className="card flex flex-col gap-3 p-5">
              <legend className="sr-only">Domanda {index + 1}</legend>
              <div className="flex items-center justify-between gap-3">
                <span className="pill pill-brand">{q.subject}</span>
                <span className={`text-xs font-semibold tabular-nums ${answered ? "text-brand-strong" : "text-muted"}`}>
                  {index + 1} / {questions.length}
                </span>
              </div>
              <p className="whitespace-pre-line text-[15px] font-semibold leading-relaxed">{q.text}</p>
              <div className="flex flex-col gap-2">
                {q.options.map((option, optionIndex) => {
                  const selected = answers[q.id] === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
                        selected
                          ? "border-brand bg-brand-tint"
                          : "border-line bg-card hover:border-brand/40 hover:bg-brand-tint/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        checked={selected}
                        onClick={() => {
                          if (answers[q.id] === option.id) deselectOption(q.id);
                        }}
                        onChange={() => selectOption(q.id, option.id)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] text-xs font-bold ${
                          selected ? "bg-brand text-white" : "bg-brand-tint text-brand-strong"
                        }`}
                      >
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span>{option.text}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {answeredCount < questions.length
            ? `${questions.length - answeredCount} domande senza risposta: valgono 0 punti.`
            : "Hai risposto a tutte le domande."}
        </p>
        <button type="button" onClick={doSubmit} disabled={isSubmitting} className="btn btn-brand disabled:opacity-60">
          {isSubmitting ? "Invio in corso…" : "Consegna il test"}
        </button>
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
