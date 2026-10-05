import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { ProgressRing } from "@/components/ProgressRing";
import { formatPoints, trackOf } from "@/lib/tracks";
import { CompletionReview } from "@/components/CompletionReview";
import { rispostaData } from "@/lib/completion";
import { testQuestionOrder } from "@/lib/test-questions";
import { formatPunti, risultatiPerProva, type RisultatoProva } from "@/lib/esame";

export default async function AttemptResultPage({
  params,
}: {
  params: Promise<{ testId: string; attemptId: string }>;
}) {
  const { testId, attemptId } = await params;
  const session = await requireStudent();

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      test: true,
      answers: {
        include: {
          question: { include: { options: { orderBy: { order: "asc" } } } },
        },
      },
    },
  });

  if (
    !attempt ||
    attempt.studentId !== session.user.id ||
    attempt.testId !== testId ||
    attempt.status !== "SUBMITTED"
  ) {
    notFound();
  }

  const percentage =
    attempt.maxScore && attempt.maxScore > 0 ? Math.round(((attempt.score ?? 0) / attempt.maxScore) * 100) : 0;

  // I punti mostrati sono quelli del percorso a cui appartiene il test.
  const track = trackOf(attempt.test.track);
  const scoring = track.scoring;

  // L'ordine è quello del test, non quello che la domanda ha nella banca dati.
  const posizione = await testQuestionOrder(attempt.testId);
  const sortedAnswers = [...attempt.answers].sort(
    (a, b) => (posizione.get(a.questionId) ?? 0) - (posizione.get(b.questionId) ?? 0)
  );
  const correctCount = sortedAnswers.filter((a) => a.isCorrect).length;
  const omittedCount = sortedAnswers.filter((a) => !rispostaData(a)).length;
  const incorrectCount = sortedAnswers.length - correctCount - omittedCount;

  // Nel semestre filtro ogni materia è un esame a sé: il punteggio totale non è
  // un voto, lo sono i tre punteggi delle tre prove.
  const prove = track.esame
    ? risultatiPerProva(
        sortedAnswers.map((a) => ({
          subject: a.question.subject,
          corretta: a.isCorrect === true,
          data: rispostaData(a),
        })),
        track
      )
    : [];
  const provaUnica = prove.length === 1 ? prove[0] : null;
  // Solo le prove intere fanno un voto: un'esercitazione corta resta un punteggio.
  const conVoto = prove.filter((p) => p.voto);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/student/dashboard" className="text-sm font-medium text-muted hover:text-brand-strong">
          &larr; I miei test
        </Link>
        <h1 className="page-title mt-2">{attempt.test.title}</h1>
      </div>

      <div className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <ProgressRing value={percentage} size={92} />
        <div className="flex flex-col gap-3">
          {provaUnica?.voto ? (
            <div>
              <p className="font-display text-4xl font-bold tracking-tight tabular-nums">
                {provaUnica.voto.etichetta}
              </p>
              <p className="mt-1 text-sm text-muted">
                {formatPunti(provaUnica.punti)} punti su {attempt.maxScore} ·{" "}
                <span
                  className={
                    provaUnica.voto.superata
                      ? "font-semibold text-green-700 dark:text-green-300"
                      : "font-semibold text-red-700 dark:text-red-300"
                  }
                >
                  {provaUnica.voto.superata ? "prova superata" : "sotto il 18, non superata"}
                </span>
              </p>
            </div>
          ) : (
            <p className="font-display text-4xl font-bold tracking-tight tabular-nums">
              {attempt.score}
              <span className="text-xl text-muted"> / {attempt.maxScore}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <span className="pill bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300">
              {correctCount} corrette · {formatPoints(scoring.correct)}
            </span>
            <span className="pill bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300">
              {incorrectCount} errate · {formatPoints(scoring.incorrect)}
            </span>
            <span className="pill bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {omittedCount} senza risposta · 0
            </span>
          </div>
        </div>
      </div>

      {conVoto.length > 1 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="section-title">Il voto, una prova per volta</h2>
            <p className="text-sm text-muted">
              Le {conVoto.length} prove sono {conVoto.length} esami distinti e fanno{" "}
              {conVoto.length} voti distinti: sommare i punteggi non vuol dire niente. Si supera da
              18/30 in su.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {conVoto.map((prova) => (
              <CartaProva key={prova.subject} prova={prova} />
            ))}
          </div>
        </section>
      )}

      <h2 className="section-title">Correzione domanda per domanda</h2>

      <div className="flex flex-col gap-3">
        {sortedAnswers.map((answer, index) => {
          const completamento = answer.question.type === "COMPLETAMENTO";
          const wasOmitted = !rispostaData(answer);
          const status = answer.isCorrect ? "correct" : wasOmitted ? "omitted" : "wrong";
          return (
            <div
              key={answer.id}
              className={`rounded-3xl border p-5 ${
                status === "correct"
                  ? "border-green-200 bg-green-50/70 dark:border-green-900/60 dark:bg-green-950/20"
                  : status === "wrong"
                    ? "border-red-200 bg-red-50/70 dark:border-red-900/60 dark:bg-red-950/20"
                    : "border-line bg-card"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-muted">
                  {index + 1} · {answer.question.subject}
                </span>
                <span
                  className={`pill ${
                    status === "correct"
                      ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
                      : status === "wrong"
                        ? "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {status === "correct"
                    ? `Corretta ${formatPoints(scoring.correct)}`
                    : status === "wrong"
                      ? `Errata ${formatPoints(scoring.incorrect)}`
                      : "Senza risposta 0"}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-relaxed">{answer.question.text}</p>
              {completamento ? (
                <CompletionReview
                  typed={answer.typedAnswer}
                  accepted={answer.question.options.filter((o) => o.isCorrect).map((o) => o.text)}
                />
              ) : (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {answer.question.options.map((option, optionIndex) => {
                    const wasSelected = option.id === answer.selectedOptionId;
                    return (
                      <li
                        key={option.id}
                        className={`flex items-start gap-2.5 text-sm ${
                          option.isCorrect
                            ? "font-semibold text-green-800 dark:text-green-300"
                            : wasSelected
                              ? "font-semibold text-red-800 dark:text-red-300"
                              : "text-muted"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                            option.isCorrect
                              ? "bg-green-600 text-white"
                              : wasSelected
                                ? "bg-red-600 text-white"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span className="pt-0.5">
                          {option.text}
                          {option.isCorrect && <span className="sr-only"> (risposta corretta)</span>}
                          {wasSelected && <span className="font-normal"> — la tua risposta</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/*
 * Il voto di una singola prova. Il numero grande è quello che finirebbe sul
 * libretto; sotto restano i punti grezzi, perché è lì che si vede il costo degli
 * errori rispetto alle risposte lasciate in bianco.
 */
function CartaProva({ prova }: { prova: RisultatoProva }) {
  const superata = prova.voto?.superata ?? false;
  return (
    <div
      className={`flex flex-col gap-2 rounded-[1.25rem] border p-4 ${
        superata
          ? "border-green-200 bg-green-50/70 dark:border-green-900/60 dark:bg-green-950/20"
          : "border-red-200 bg-red-50/70 dark:border-red-900/60 dark:bg-red-950/20"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{prova.subject}</p>
      <p className="font-display text-3xl font-bold tracking-tight tabular-nums">
        {prova.voto?.etichetta ?? formatPunti(prova.punti)}
      </p>
      <p
        className={`text-xs font-semibold ${
          superata ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
        }`}
      >
        {superata ? "Superata" : "Non superata"} · {formatPunti(prova.punti)} punti
      </p>
      <p className="text-xs text-muted">
        {prova.corrette} corrette · {prova.errate} errate · {prova.omesse} in bianco
      </p>
    </div>
  );
}
