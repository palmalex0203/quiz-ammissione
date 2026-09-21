import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { startAttempt } from "@/app/student/dashboard/actions";

export type StudentTest = {
  id: string;
  title: string;
  description: string | null;
  timeLimitMinutes: number | null;
  maxAttempts: number | null;
  _count: { questions: number };
  attempts: { id: string; status: "IN_PROGRESS" | "SUBMITTED" }[];
};

/**
 * Riga di un test assegnato (simulazione in classe o esercitazione del docente):
 * dati essenziali, link all'ultimo risultato e il pulsante giusto per lo stato
 * (inizia, continua, rifai, tentativi esauriti). I tentativi vanno dal più recente.
 */
export function StudentTestCard({ test, compact }: { test: StudentTest; compact?: boolean }) {
  const inProgress = test.attempts.find((a) => a.status === "IN_PROGRESS");
  const lastSubmitted = test.attempts.find((a) => a.status === "SUBMITTED");
  const attemptsUsed = test.attempts.length;
  const remaining = test.maxAttempts != null ? test.maxAttempts - attemptsUsed : null;
  const canAttempt = remaining === null || remaining > 0;

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
        compact ? "rounded-2xl border border-line px-4 py-3" : "card card-link px-5 py-4"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{test.title}</p>
          {inProgress && <span className="pill pill-brand">In corso</span>}
          {!inProgress && lastSubmitted && (
            <span className="pill bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">Svolto</span>
          )}
        </div>
        {test.description && <p className="mt-0.5 text-xs text-muted">{test.description}</p>}
        <p className="mt-1 text-xs text-muted">
          {test._count.questions} domande
          {test.timeLimitMinutes ? ` · ${test.timeLimitMinutes} min` : ""}
          {test.maxAttempts != null ? ` · ${attemptsUsed}/${test.maxAttempts} tentativi` : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {lastSubmitted && (
          <Link
            href={`/student/tests/${test.id}/result/${lastSubmitted.id}`}
            className="text-xs font-semibold text-muted hover:text-brand-strong"
          >
            Ultimo risultato
          </Link>
        )}

        {inProgress ? (
          <form action={startAttempt}>
            <input type="hidden" name="testId" value={test.id} />
            <SubmitButton pendingText="Apro il test…" className="btn btn-sm btn-brand">
              Continua
            </SubmitButton>
          </form>
        ) : canAttempt ? (
          <form action={startAttempt}>
            <input type="hidden" name="testId" value={test.id} />
            <SubmitButton pendingText="Avvio il test…" className="btn btn-sm btn-ink">
              {attemptsUsed > 0 ? "Rifai" : "Inizia"}
            </SubmitButton>
          </form>
        ) : (
          <span className="text-xs font-medium text-muted">Tentativi esauriti</span>
        )}
      </div>
    </div>
  );
}
