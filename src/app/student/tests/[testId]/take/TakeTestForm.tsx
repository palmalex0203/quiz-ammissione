"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { consegnaSezione, submitAttempt } from "./actions";
import { useAnswerQueue, type SaveState } from "./useAnswerQueue";
import { COMPLETION_MAX_LENGTH } from "@/lib/completion";

type Question = {
  id: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "COMPLETAMENTO";
  subject: string;
  text: string;
  options: { id: string; text: string }[];
};

/** Una materia della prova, per l'elenco laterale. */
export type SezioneInfo = { subject: string; domande: number; minutes: number | null };

export function TakeTestForm({
  testTitle,
  attemptId,
  timeLimitMinutes,
  startedAt,
  questions,
  initialAnswers,
  initialTyped,
  sezioni,
  sezioneCorrente,
}: {
  testTitle: string;
  attemptId: string;
  timeLimitMinutes: number | null;
  startedAt: string;
  questions: Question[];
  initialAnswers: Record<string, string>;
  initialTyped: Record<string, string>;
  // null quando la prova è di una materia sola: allora non c'è niente da scandire.
  sezioni: SezioneInfo[] | null;
  sezioneCorrente: number;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  // Le risposte scritte stanno separate da quelle scelte: una domanda a
  // completamento non ha un'opzione, ha un testo.
  const [typed, setTyped] = useState<Record<string, string>>(initialTyped);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const submittedRef = useRef(false);
  const [saveError, setSaveError] = useState(false);
  const [chiedoConferma, setChiedoConferma] = useState(false);
  const [elencoAperto, setElencoAperto] = useState(false);

  const aSezioni = sezioni != null && sezioni.length > 1;
  const ultima = !aSezioni || sezioneCorrente >= sezioni.length - 1;
  const materiaOra = aSezioni ? sezioni[sezioneCorrente]?.subject : null;
  const materiaDopo = aSezioni ? sezioni[sezioneCorrente + 1]?.subject : null;

  // Le risposte non partono una alla volta: si accumulano e vanno insieme, con
  // ritentativi se la rete salta. Vedi useAnswerQueue.ts.
  const { enqueue, drain, state: saveState } = useAnswerQueue(attemptId);

  const deadline =
    timeLimitMinutes != null ? new Date(startedAt).getTime() + timeLimitMinutes * 60_000 : null;
  const [remainingMs, setRemainingMs] = useState(() => (deadline ? deadline - Date.now() : null));

  function doSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSaveError(false);
    setChiedoConferma(false);
    startSubmitTransition(async () => {
      // Prima di consegnare si aspetta che tutte le risposte siano arrivate:
      // consegnare con la coda piena vorrebbe dire buttarle via.
      if (!(await drain())) {
        submittedRef.current = false;
        setSaveError(true);
        return;
      }
      // Con le sezioni la consegna la decide il server: è lui a sapere se questa
      // materia era l'ultima e quindi se il tentativo va corretto.
      if (aSezioni) await consegnaSezione(attemptId);
      else await submitAttempt(attemptId);
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
    enqueue(questionId, { selectedOptionId: optionId, typedAnswer: null });
  }

  function deselectOption(questionId: string) {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    enqueue(questionId, { selectedOptionId: null, typedAnswer: null });
  }

  function writeAnswer(questionId: string, value: string) {
    const testo = value.slice(0, COMPLETION_MAX_LENGTH);
    setTyped((prev) => ({ ...prev, [questionId]: testo }));
    enqueue(questionId, { selectedOptionId: null, typedAnswer: testo.trim() === "" ? null : testo });
  }

  const risposta = (q: Question) =>
    q.type === "COMPLETAMENTO" ? (typed[q.id] ?? "").trim() !== "" : answers[q.id] != null;

  const answeredCount = questions.filter(risposta).length;
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  function vaiA(numero: number) {
    setElencoAperto(false);
    document.getElementById(`domanda-${numero}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  const etichettaConsegna = !aSezioni
    ? "Consegna il test"
    : ultima
      ? "Consegna la prova"
      : `Consegna ${materiaOra}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-30 -mx-4 flex flex-col gap-3 border-b border-line bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold tracking-tight sm:text-2xl">
              {aSezioni ? materiaOra : testTitle}
            </h1>
            <p className="text-sm text-muted">
              {aSezioni && (
                <span className="font-semibold text-brand-strong">
                  Materia {sezioneCorrente + 1} di {sezioni.length} ·{" "}
                </span>
              )}
              {answeredCount} di {questions.length} risposte date
            </p>
          </div>
          <SaveBadge state={saveState} />
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

      <div className="grid gap-6 lg:grid-cols-[1fr_13.5rem] lg:items-start">
        <aside className="lg:sticky lg:top-32 lg:order-2">
          <button
            type="button"
            onClick={() => setElencoAperto((v) => !v)}
            aria-expanded={elencoAperto}
            className="btn btn-soft w-full justify-between lg:hidden"
          >
            <span>Elenco domande</span>
            <span className="text-xs tabular-nums text-muted">
              {answeredCount}/{questions.length}
            </span>
          </button>

          <div className={`${elencoAperto ? "mt-3 flex" : "hidden"} flex-col gap-4 lg:mt-0 lg:flex`}>
            {aSezioni && (
              <div className="card flex flex-col gap-1.5 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Le tre prove</p>
                {sezioni.map((s, i) => {
                  const stato = i < sezioneCorrente ? "consegnata" : i === sezioneCorrente ? "aperta" : "bloccata";
                  return (
                    <div
                      key={s.subject}
                      className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs ${
                        stato === "aperta" ? "bg-brand-tint font-semibold text-brand-strong" : "text-muted"
                      }`}
                    >
                      <span className="truncate">{s.subject}</span>
                      <span aria-hidden="true" className="shrink-0">
                        {stato === "consegnata" ? "✓" : stato === "bloccata" ? "🔒" : `${s.minutes ?? "—"}′`}
                      </span>
                      <span className="sr-only">
                        {stato === "consegnata"
                          ? "consegnata"
                          : stato === "bloccata"
                            ? "ancora bloccata"
                            : "in corso"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <nav aria-label="Domande" className="card flex flex-col gap-2 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Domande</p>
              <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10 lg:grid-cols-5">
                {questions.map((q, i) => {
                  const fatta = risposta(q);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => vaiA(i + 1)}
                      aria-label={`Domanda ${i + 1}${fatta ? ", con risposta" : ", senza risposta"}`}
                      className={`flex h-8 items-center justify-center rounded-lg text-xs font-bold tabular-nums transition-colors ${
                        fatta
                          ? "bg-brand text-white"
                          : "bg-brand-tint text-brand-strong hover:bg-brand-soft"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] leading-snug text-muted">
                Piene le domande a cui hai risposto. Toccane una per andarci.
              </p>
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-4 lg:order-1">
          {questions.map((q, index) => {
            const answered = risposta(q);
            return (
              <fieldset
                key={q.id}
                id={`domanda-${index + 1}`}
                className="card flex scroll-mt-28 flex-col gap-3 p-5"
              >
                <legend className="sr-only">Domanda {index + 1}</legend>
                <div className="flex items-center justify-between gap-3">
                  <span className="pill pill-brand">{q.subject}</span>
                  <span
                    className={`text-xs font-semibold tabular-nums ${answered ? "text-brand-strong" : "text-muted"}`}
                  >
                    {index + 1} / {questions.length}
                  </span>
                </div>
                <p className="whitespace-pre-line text-[15px] font-semibold leading-relaxed">{q.text}</p>
                {q.type === "COMPLETAMENTO" ? (
                  <CompletionInput
                    questionId={q.id}
                    value={typed[q.id] ?? ""}
                    onChange={(v) => writeAnswer(q.id, v)}
                  />
                ) : (
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
                )}
              </fieldset>
            );
          })}

          <div className="card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              {answeredCount < questions.length
                ? `${questions.length - answeredCount} domande senza risposta: valgono 0 punti.`
                : "Hai risposto a tutte le domande."}
            </p>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              {saveError && (
                <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-300">
                  Alcune risposte non sono ancora arrivate. Controlla la connessione e riprova.
                </p>
              )}
              {chiedoConferma ? (
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <p className="text-sm font-semibold">
                    {ultima
                      ? "Consegni la prova e vedi subito il risultato."
                      : `Dopo non potrai più tornare su ${materiaOra}, e parte il tempo di ${materiaDopo}.`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setChiedoConferma(false)}
                      className="btn btn-sm btn-soft"
                    >
                      Annulla
                    </button>
                    <button
                      type="button"
                      onClick={doSubmit}
                      disabled={isSubmitting}
                      className="btn btn-sm btn-brand disabled:opacity-60"
                    >
                      {isSubmitting ? "Invio in corso…" : "Sì, consegna"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => (aSezioni ? setChiedoConferma(true) : doSubmit())}
                  disabled={isSubmitting}
                  className="btn btn-brand disabled:opacity-60"
                >
                  {isSubmitting ? "Invio in corso…" : etichettaConsegna}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * Lo stato dei salvataggi. Quando è tutto a posto resta discreto: è quando le
 * risposte non stanno arrivando che lo studente deve accorgersene, perché è lì
 * che rischia di perdere il lavoro.
 */
function SaveBadge({ state }: { state: SaveState }) {
  if (state === "salvato") {
    return (
      <span className="hidden shrink-0 text-xs font-semibold text-muted sm:inline" aria-live="polite">
        Salvato
      </span>
    );
  }
  if (state === "invio") {
    return (
      <span className="hidden shrink-0 text-xs font-semibold text-muted sm:inline" aria-live="polite">
        Salvataggio…
      </span>
    );
  }
  return (
    <span
      aria-live="assertive"
      className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
    >
      Non salvato · riprovo
    </span>
  );
}

/*
 * Il campo delle domande a completamento. All'esame vero si scrive in stampatello
 * su una griglia di sedici caselle: qui si tiene lo stesso limite e lo si mostra,
 * perché far entrare la risposta in sedici caratteri fa parte dell'esercizio.
 */
function CompletionInput({
  questionId,
  value,
  onChange,
}: {
  questionId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const rimasti = COMPLETION_MAX_LENGTH - value.length;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`completamento-${questionId}`} className="text-xs font-semibold text-muted">
        Scrivi la risposta
      </label>
      <div className="flex items-center gap-3">
        <input
          id={`completamento-${questionId}`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={COMPLETION_MAX_LENGTH}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="field w-full max-w-xs font-mono text-base uppercase tracking-wider"
        />
        <span aria-hidden="true" className="shrink-0 text-xs tabular-nums text-muted">
          {rimasti}
        </span>
      </div>
      <p className="text-xs text-muted">
        Una parola, un numero o una breve espressione, al massimo {COMPLETION_MAX_LENGTH} caratteri.
      </p>
    </div>
  );
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
