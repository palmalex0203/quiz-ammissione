import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";
import { formatPoints, formatScore, trackOf } from "@/lib/tracks";
import { CompletionReview } from "@/components/CompletionReview";
import { rispostaData } from "@/lib/completion";
import { testQuestionOrder } from "@/lib/test-questions";
import { risultatiPerProva, votoDaRiepilogo, type VotoProva } from "@/lib/esame";
import { titoloTest } from "@/lib/titoli";

export default async function TeacherAttemptDetailPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const session = await requireTeacher();

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      test: true,
      student: true,
      answers: {
        include: { question: { include: { options: { orderBy: { order: "asc" } } } } },
      },
      subjectStats: true,
    },
  });

  if (!attempt || attempt.test.createdById !== session.user.id || attempt.status !== "SUBMITTED") {
    notFound();
  }

  const percentage =
    attempt.maxScore && attempt.maxScore > 0 ? Math.round(((attempt.score ?? 0) / attempt.maxScore) * 100) : 0;
  const track = trackOf(attempt.test.track);
  const ordineMaterie = (subject: string) =>
    track.subjects.findIndex((s) => s.name === subject) + 1 || 99;
  const scoring = track.scoring;
  // L'ordine è quello del test, non quello che la domanda ha nella banca dati.
  const posizione = await testQuestionOrder(attempt.testId);
  const sortedAnswers = [...attempt.answers].sort(
    (a, b) => (posizione.get(a.questionId) ?? 0) - (posizione.get(b.questionId) ?? 0)
  );
  /*
   * Il riepilogo si legge dalle statistiche per materia, non contando le righe
   * di risposta rimaste.
   *
   * Ricaricare la banca dati cancellava le domande e con loro, a cascata, le
   * risposte già date: è successo il 2026-10-07 a tre simulazioni del semestre
   * filtro (scripts/import-pool.ts ora lo impedisce). Di quei tentativi resta il
   * punteggio e restano le statistiche per materia, ma non la correzione: contare
   * le risposte superstiti faceva scrivere "0 corrette, 0 errate, 1 omesse su 1"
   * sotto un 11,7/93, due numeri che si smentivano a vicenda.
   */
  const daStatistiche = attempt.subjectStats.reduce(
    (acc, s) => ({
      corrette: acc.corrette + s.correct,
      date: acc.date + s.answered,
      totale: acc.totale + s.total,
    }),
    { corrette: 0, date: 0, totale: 0 }
  );
  const conStatistiche = attempt.subjectStats.length > 0 && daStatistiche.totale > 0;
  const correctCount = conStatistiche
    ? daStatistiche.corrette
    : sortedAnswers.filter((a) => a.isCorrect).length;
  const totalCount = conStatistiche ? daStatistiche.totale : sortedAnswers.length;
  const omittedCount = conStatistiche
    ? daStatistiche.totale - daStatistiche.date
    : sortedAnswers.filter((a) => !rispostaData(a)).length;
  const incorrectCount = totalCount - correctCount - omittedCount;
  // Correzione incompleta: le domande di questo tentativo non ci sono più tutte.
  const correzioneIncompleta = conStatistiche && sortedAnswers.length < daStatistiche.totale;

  /*
   * Nel semestre filtro ogni materia è un esame a sé: il voto che conta è quello
   * della singola prova, non il totale. Solo le prove intere fanno un voto:
   * un'esercitazione corta resta un punteggio.
   *
   * I voti si ricavano dalle statistiche per materia, come già fa lo storico
   * dello studente: ricavarli dalle risposte significava perderli sui tentativi a
   * cui la ricarica della banca dati ha portato via le righe.
   */
  const prove = !track.esame
    ? []
    : conStatistiche
      ? attempt.subjectStats
          .map((s) => ({ subject: s.subject, voto: votoDaRiepilogo(s, track) }))
          .filter((p): p is { subject: string; voto: VotoProva } => p.voto != null)
          .sort((a, b) => ordineMaterie(a.subject) - ordineMaterie(b.subject))
      : risultatiPerProva(
          sortedAnswers.map((a) => ({
            subject: a.question.subject,
            corretta: a.isCorrect === true,
            data: rispostaData(a),
          })),
          track
        )
          .filter((p) => p.voto)
          .map((p) => ({ subject: p.subject, voto: p.voto! }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/teacher/results"
          className="text-sm font-medium text-muted hover:text-brand-strong"
        >
          &larr; Tutti i risultati
        </Link>
        <h1 className="mt-1 page-title">{titoloTest(attempt.test.title).nome}</h1>
        <p className="text-sm text-muted">
          {attempt.student.name} &middot; {attempt.submittedAt?.toLocaleString("it-IT")}
        </p>
      </div>

      <div className="card p-6">
        <p className="font-display text-4xl font-bold tabular-nums">
          {formatScore(attempt.score)} / {formatScore(attempt.maxScore)}
        </p>
        <p className="mt-1 text-sm text-muted">
          {percentage}% &middot; {correctCount} corrette, {incorrectCount} errate, {omittedCount} omesse su{" "}
          {totalCount}
        </p>
        {prove.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            {prove.map((prova) => (
              <span
                key={prova.subject}
                className={`pill ${
                  prova.voto.superata
                    ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
                    : "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
                }`}
              >
                {prova.subject}: {prova.voto.etichetta}
              </span>
            ))}
          </div>
        )}
      </div>

      {correzioneIncompleta && (
        <div className="rounded-[1.25rem] border border-amber-300 bg-amber-50 px-5 py-4 text-sm dark:border-amber-500/40 dark:bg-amber-500/10">
          <p>
            <strong className="font-semibold">Correzione non più disponibile per intero.</strong> Di questo
            tentativo resta{sortedAnswers.length === 1 ? " una domanda" : `no ${sortedAnswers.length} domande`} su{" "}
            {totalCount}: le altre sono state tolte dalla banca dati dopo la consegna, e con loro le risposte
            date. Il punteggio e il riepilogo qui sopra sono quelli calcolati alla consegna e restano validi.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sortedAnswers.map((answer, index) => {
          const correctOption = answer.question.options.find((o) => o.isCorrect);
          const completamento = answer.question.type === "COMPLETAMENTO";
          const wasOmitted = !rispostaData(answer);
          return (
            <div
              key={answer.id}
              className={`rounded-3xl border p-5 ${
                answer.isCorrect
                  ? "border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/20"
                  : wasOmitted
                    ? "border-line bg-card"
                    : "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/20"
              }`}
            >
              <p className="flex items-center justify-between text-xs font-medium text-muted">
                <span>
                  Domanda {index + 1} &middot; {answer.question.subject}
                </span>
                <span
                  className={
                    answer.isCorrect
                      ? "text-green-700 dark:text-green-400"
                      : wasOmitted
                        ? "text-muted"
                        : "text-red-700 dark:text-red-400"
                  }
                >
                  {answer.isCorrect ? formatPoints(scoring.correct) : wasOmitted ? "0" : formatPoints(scoring.incorrect)}
                </span>
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {answer.question.text}
              </p>
              {completamento ? (
                <CompletionReview
                  typed={answer.typedAnswer}
                  accepted={answer.question.options.filter((o) => o.isCorrect).map((o) => o.text)}
                  lettore="docente"
                />
              ) : (
                <ul className="mt-2 flex flex-col gap-0.5">
                  {answer.question.options.map((option) => {
                    const wasSelected = option.id === answer.selectedOptionId;
                    return (
                      <li
                        key={option.id}
                        className={`text-xs ${
                          option.isCorrect
                            ? "font-medium text-green-700 dark:text-green-400"
                            : wasSelected
                              ? "font-medium text-red-700 dark:text-red-400"
                              : "text-muted"
                        }`}
                      >
                        {option.isCorrect ? "✓ " : wasSelected ? "✗ " : "— "}
                        {option.text}
                        {wasSelected && " (risposta data)"}
                      </li>
                    );
                  })}
                </ul>
              )}
              {/*
                * Solo per le domande a scelta multipla: in quelle a completamento la
                * risposta attesa e l'eventuale "non data" le dice già CompletionReview,
                * e ripeterle qui faceva dire due volte la stessa cosa. In più
                * selectedOptionId è sempre vuoto a completamento, quindi "Nessuna
                * risposta data" compariva anche sotto una risposta scritta.
                */}
              {!completamento && !answer.isCorrect && correctOption && (
                <p className="mt-2 text-xs text-muted">
                  Risposta corretta: <span className="font-medium">{correctOption.text}</span>
                </p>
              )}
              {!completamento && wasOmitted && (
                <p className="mt-2 text-xs text-muted">Nessuna risposta data.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
