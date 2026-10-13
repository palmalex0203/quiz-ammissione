import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { ProgressRing } from "@/components/ProgressRing";
import { formatPoints, formatScore, trackOf } from "@/lib/tracks";
import { CompletionReview } from "@/components/CompletionReview";
import { rispostaData } from "@/lib/completion";
import { testQuestionOrder } from "@/lib/test-questions";
import { formatPunti, risultatiDaRiepilogo, risultatiPerProva, type RisultatoProva } from "@/lib/esame";
import { titoloTest } from "@/lib/titoli";

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
      subjectStats: true,
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

  const titolo = titoloTest(attempt.test.title);
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
  /*
   * Il riepilogo viene dalle statistiche per materia salvate alla consegna, non
   * dal conteggio delle righe di risposta rimaste: ricaricare la banca dati
   * cancellava le domande e con loro le risposte già date, e di quei tentativi
   * resta il punteggio ma non la correzione (vedi risultatiDaRiepilogo).
   */
  const riepilogo = attempt.subjectStats.reduce(
    (acc, s) => ({
      corrette: acc.corrette + s.correct,
      date: acc.date + s.answered,
      totale: acc.totale + s.total,
    }),
    { corrette: 0, date: 0, totale: 0 }
  );
  const conRiepilogo = attempt.subjectStats.length > 0 && riepilogo.totale > 0;
  const correctCount = conRiepilogo ? riepilogo.corrette : sortedAnswers.filter((a) => a.isCorrect).length;
  const totalCount = conRiepilogo ? riepilogo.totale : sortedAnswers.length;
  const omittedCount = conRiepilogo
    ? riepilogo.totale - riepilogo.date
    : sortedAnswers.filter((a) => !rispostaData(a)).length;
  const incorrectCount = totalCount - correctCount - omittedCount;
  const correzioneIncompleta = conRiepilogo && sortedAnswers.length < riepilogo.totale;

  // Nel semestre filtro ogni materia è un esame a sé: il punteggio totale non è
  // un voto, lo sono i tre punteggi delle tre prove.
  const prove = !track.esame
    ? []
    : conRiepilogo
      ? risultatiDaRiepilogo(attempt.subjectStats, track)
      : risultatiPerProva(
          sortedAnswers.map((a) => ({
            subject: a.question.subject,
            corretta: a.isCorrect === true,
            data: rispostaData(a),
          })),
          track
        );
  const provaUnica = prove.length === 1 ? prove[0] : null;
  // Solo le prove intere fanno un voto: un'esercitazione corta resta un punteggio.
  const conVoto = prove.filter((p) => p.voto);

  return (
    <div className="flex flex-col gap-6">
      <div>
        {/* Il ritorno porta alla stessa sezione che la navigazione chiama
          * "Pratica": chiamarla "I miei test" era un terzo nome per la stessa
          * pagina. */}
        <Link href="/student/dashboard" className="text-sm font-medium text-muted hover:text-brand-strong">
          &larr; Pratica
        </Link>
        <h1 className="page-title mt-2">{titolo.nome}</h1>
        {titolo.quando && <p className="mt-1 text-sm text-muted">Svolto il {titolo.quando}</p>}
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
                {formatPunti(provaUnica.punti)} punti su {formatScore(attempt.maxScore)} ·{" "}
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
              {formatScore(attempt.score)}
              <span className="text-xl text-muted"> / {formatScore(attempt.maxScore)}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <span className="pill bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300">
              {correctCount} corrette · {formatPoints(scoring.correct)}
            </span>
            <span className="pill bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300">
              {incorrectCount} errate · {formatPoints(scoring.incorrect)}
            </span>
            <span className="pill bg-line text-foreground">
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Correzione domanda per domanda</h2>
        {/*
          * Rivedere una simulazione da 60 domande voleva dire scorrere tutte le
          * risposte giuste per ritrovare le proprie. Il filtro è una casella di
          * spunta e una regola CSS: niente da caricare, funziona anche da tastiera.
          */}
        {correctCount > 0 && correctCount < sortedAnswers.length && (
          <label className="pill cursor-pointer select-none border border-line bg-card has-[:checked]:border-transparent has-[:checked]:bg-brand-action has-[:checked]:text-on-brand-action has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand">
            <input type="checkbox" className="solo-errori sr-only" />
            Mostra solo quello che hai sbagliato ({sortedAnswers.length - correctCount})
          </label>
        )}
      </div>

      {correzioneIncompleta && (
        <div className="rounded-[1.25rem] border border-amber-300 bg-amber-50 px-5 py-4 text-sm dark:border-amber-500/40 dark:bg-amber-500/10">
          <p>
            <strong className="font-semibold">Qui sotto manca qualche domanda.</strong> Di questa prova
            puoi rivedere {sortedAnswers.length === 1 ? "una domanda" : `${sortedAnswers.length} domande`} su{" "}
            {totalCount}: le altre sono state tolte dalla banca dati dopo la consegna. Il punteggio e il
            riepilogo qui sopra sono quelli di quel giorno e non cambiano.
          </p>
        </div>
      )}

      <div className="correzione flex flex-col gap-3">
        {sortedAnswers.map((answer, index) => {
          const completamento = answer.question.type === "COMPLETAMENTO";
          const wasOmitted = !rispostaData(answer);
          const status = answer.isCorrect ? "correct" : wasOmitted ? "omitted" : "wrong";
          return (
            <div
              key={answer.id}
              data-esito={status}
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
                        : "bg-line text-foreground"
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
                                : "bg-line text-foreground"
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
