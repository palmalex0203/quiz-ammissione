"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DomandaIngresso, Esito, Prova } from "@/lib/prova-ingresso";
import { consegnaProva, iniziaProva } from "./azioni";

const GUASTO = "Non siamo riusciti a parlare col server. Controlla la rete e riprova.";

/** Una chiamata al server che non esplode quando la rete non c'è. */
async function chiama<T>(f: () => Promise<T>): Promise<T | { ok: false; errore: string }> {
  try {
    return await f();
  } catch {
    return { ok: false, errore: GUASTO };
  }
}

type Fase = "apertura" | "prova" | "risultato";

export default function ProvaIngressoPagina({ prova, totale }: { prova: Prova; totale: number }) {
  const [fase, setFase] = useState<Fase>("apertura");
  const [provaId, setProvaId] = useState<string | null>(null);
  const [esito, setEsito] = useState<Esito | null>(null);

  return (
    <div className="min-h-screen bg-background py-8">
      {fase === "apertura" && (
        <Apertura
          prova={prova}
          totale={totale}
          onAvvio={(id) => {
            setProvaId(id);
            setFase("prova");
            window.scrollTo({ top: 0 });
          }}
        />
      )}

      {fase === "prova" && provaId && (
        <Svolgimento
          prova={prova}
          provaId={provaId}
          onFinita={(e) => {
            setEsito(e);
            setFase("risultato");
            window.scrollTo({ top: 0 });
          }}
        />
      )}

      {fase === "risultato" && esito && <Risultato esito={esito} totale={totale} />}
    </div>
  );
}

/* ----------------------------------------------------------------- apertura */

function Apertura({
  prova,
  totale,
  onAvvio,
}: {
  prova: Prova;
  totale: number;
  onAvvio: (provaId: string) => void;
}) {
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const minuti = prova.sezioni.reduce((n, s) => n + s.minuti, 0);

  async function avvia(e: React.FormEvent) {
    e.preventDefault();
    if (inCorso) return;
    setInCorso(true);
    setErrore(null);

    const r = await chiama(() => iniziaProva(nome, cognome));
    setInCorso(false);
    if (r.ok) onAvvio(r.provaId);
    else setErrore(r.errore);
  }

  return (
    <div className="mx-auto max-w-2xl px-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-strong">Semestre filtro</p>
      <h1 className="mt-1 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        Test di valutazione iniziale
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Serve a capire da dove si parte, prima della prima lezione. Non è un voto e non fa media:
        misura quello che si porta dalle superiori, non il programma del corso, che devi ancora fare.
      </p>

      <ul className="mt-6 flex flex-col gap-2">
        {[
          `${totale} domande: ${prova.sezioni.map((s) => `${s.domande} di ${s.short.toLowerCase()}`).join(", ")}.`,
          `${minuti} minuti in tutto, ${prova.sezioni[0].minuti} per ogni materia. Allo scadere si passa avanti.`,
          "Risposta esatta +1, sbagliata −0,1, non data 0. Se proprio non sai, lascia in bianco.",
          "Niente calcolatrice e niente appunti: i conti che servono si fanno a mente.",
        ].map((riga) => (
          <li key={riga} className="flex items-start gap-2.5 text-sm">
            <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>{riga}</span>
          </li>
        ))}
      </ul>

      <form onSubmit={avvia} className="card mt-7 flex flex-col gap-4 p-5 sm:p-7">
        <p className="font-display text-xl font-bold">Chi sei</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pi-nome" className="text-sm font-semibold">
              Nome
            </label>
            <input
              id="pi-nome"
              className="field"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={60}
              autoComplete="given-name"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pi-cognome" className="text-sm font-semibold">
              Cognome
            </label>
            <input
              id="pi-cognome"
              className="field"
              value={cognome}
              onChange={(e) => setCognome(e.target.value)}
              maxLength={60}
              autoComplete="family-name"
              required
            />
          </div>
        </div>

        {errore && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-500/10 dark:text-red-300">
            {errore}
          </p>
        )}

        <button type="submit" className="btn btn-brand w-full py-3 text-base" disabled={inCorso}>
          {inCorso ? "Preparo la prova…" : "Comincia il test →"}
        </button>

        <p className="text-xs leading-relaxed text-muted">
          Nome e cognome servono solo a far arrivare il tuo risultato ai docenti del corso: non
          finiscono in nessuna lista e non li usiamo per scriverti. Il cronometro parte al clic.
        </p>
      </form>
    </div>
  );
}

/* --------------------------------------------------------------- lo svolgimento */

type Risposte = Record<string, string>;
type StatoProva = { sezione: number; risposte: Risposte };

const CHIAVE_LOCALE = "prova-ingresso";

/**
 * Quello che era stato risposto prima di un ricaricamento. Si legge al primo
 * render e non dentro un effetto: questo componente compare solo dopo un clic,
 * quindi non viene mai disegnato sul server e `localStorage` c'è sempre. In
 * finestra anonima o con i cookie bloccati la lettura fallisce e si riparte da
 * zero, senza rompere niente.
 */
function ripristina(provaId: string): StatoProva {
  try {
    const salvato = localStorage.getItem(`${CHIAVE_LOCALE}-${provaId}`);
    if (salvato) {
      const d = JSON.parse(salvato) as Partial<StatoProva>;
      return { sezione: d.sezione ?? 0, risposte: d.risposte ?? {} };
    }
  } catch {
    // Si riparte da zero.
  }
  return { sezione: 0, risposte: {} };
}

function Svolgimento({
  prova,
  provaId,
  onFinita,
}: {
  prova: Prova;
  provaId: string;
  onFinita: (esito: Esito) => void;
}) {
  const [stato, setStato] = useState<StatoProva>(() => ripristina(provaId));
  const { sezione, risposte } = stato;
  const [secondi, setSecondi] = useState(prova.sezioni[0].minuti * 60);
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const consegnata = useRef(false);

  // Un ricaricamento per sbaglio a tre quarti della prova sarebbe un disastro:
  // quello che è stato risposto resta nel browser.
  useEffect(() => {
    try {
      localStorage.setItem(`${CHIAVE_LOCALE}-${provaId}`, JSON.stringify(stato));
    } catch {
      // Se non si può salvare, la prova continua lo stesso.
    }
  }, [provaId, stato]);

  const ultima = sezione === prova.sezioni.length - 1;

  const consegnaTutto = useCallback(async () => {
    if (consegnata.current) return;
    consegnata.current = true;
    setInCorso(true);
    setErrore(null);

    const elenco = Object.entries(risposte).map(([questionId, optionId]) => ({ questionId, optionId }));
    const r = await chiama(() => consegnaProva(provaId, elenco));
    setInCorso(false);

    if (r.ok) {
      try {
        localStorage.removeItem(`${CHIAVE_LOCALE}-${provaId}`);
      } catch {
        // È solo pulizia.
      }
      onFinita(r.esito);
    } else {
      // Le risposte sono ancora tutte qui: si può ritentare senza rifare niente.
      consegnata.current = false;
      setErrore(r.errore);
    }
  }, [onFinita, provaId, risposte]);

  const avanti = useCallback(() => {
    if (ultima) {
      void consegnaTutto();
    } else {
      setStato((st) => ({ ...st, sezione: st.sezione + 1 }));
      setSecondi(prova.sezioni[sezione + 1].minuti * 60);
      window.scrollTo({ top: 0 });
    }
  }, [consegnaTutto, prova.sezioni, sezione, ultima]);

  // Il cronometro di ciascuna materia. Allo scadere si passa alla successiva:
  // il tempo di una materia non si presta a un'altra.
  useEffect(() => {
    const t = setInterval(() => {
      setSecondi((s) => {
        if (s <= 1) {
          clearInterval(t);
          avanti();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [avanti, sezione]);

  const corrente = prova.sezioni[sezione];
  const domande = useMemo(
    () => prova.domande.filter((d) => d.sezione === sezione),
    [prova.domande, sezione]
  );
  const date = domande.filter((d) => risposte[d.id]).length;

  const mm = String(Math.floor(secondi / 60)).padStart(2, "0");
  const ss = String(secondi % 60).padStart(2, "0");
  const agliSgoccioli = secondi <= 120;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-line bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-sm font-semibold">
            {corrente.short}
            <span className="font-normal text-muted">
              {" "}
              · parte {sezione + 1} di {prova.sezioni.length}
            </span>
          </span>
          <span
            className={`font-display text-lg font-bold tabular-nums ${agliSgoccioli ? "text-red-700 dark:text-red-400" : ""}`}
            aria-label="tempo rimasto"
          >
            {mm}:{ss}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1 flex-1 rounded-full bg-line">
            <div
              className="h-1 rounded-full bg-brand transition-[width] duration-300"
              style={{ width: `${(date / Math.max(1, domande.length)) * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted">
            {date}/{domande.length}
          </span>
        </div>
      </div>

      <ol className="flex flex-col gap-5">
        {domande.map((d) => (
          <Domanda
            key={d.id}
            domanda={d}
            scelta={risposte[d.id]}
            onRispondi={(optionId) =>
              setStato((st) => ({ ...st, risposte: { ...st.risposte, [d.id]: optionId } }))
            }
          />
        ))}
      </ol>

      <button onClick={avanti} className="btn btn-brand mt-8 w-full py-3 text-base" disabled={inCorso}>
        {inCorso
          ? "Sto correggendo…"
          : errore
            ? "Riprova a consegnare"
            : ultima
              ? "Consegna il test"
              : `Passa a ${prova.sezioni[sezione + 1].short}`}
      </button>

      {errore ? (
        <p className="mt-2 text-center text-sm text-red-700 dark:text-red-400">
          {errore} Le tue risposte sono ancora qui: non chiudere la pagina.
        </p>
      ) : (
        <p className="mt-2 text-center text-xs text-muted">
          {ultima
            ? "Le domande lasciate in bianco valgono zero, non tolgono punti."
            : "Una parte consegnata non si riapre."}
        </p>
      )}
    </div>
  );
}

function Domanda({
  domanda,
  scelta,
  onRispondi,
}: {
  domanda: DomandaIngresso;
  scelta?: string;
  onRispondi: (optionId: string) => void;
}) {
  return (
    <li className="card p-5">
      <p className="pill pill-brand mb-3">{domanda.numero}</p>
      <p className="font-semibold leading-snug">{domanda.text}</p>

      <div className="mt-4 flex flex-col gap-2">
        {domanda.options.map((o, j) => {
          const presa = scelta === o.id;
          return (
            <label
              key={o.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                presa ? "border-brand bg-brand-tint" : "border-control-line hover:border-brand/40"
              }`}
            >
              <input
                type="radio"
                name={domanda.id}
                className="sr-only"
                checked={presa}
                onChange={() => onRispondi(o.id)}
              />
              <span
                aria-hidden
                className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                  presa ? "border-brand bg-brand text-white" : "border-control-line"
                }`}
              >
                {"ABCDE"[j]}
              </span>
              <span>{o.text}</span>
            </label>
          );
        })}
      </div>
    </li>
  );
}

/* ---------------------------------------------------------------- risultato */

function Risultato({ esito, totale }: { esito: Esito; totale: number }) {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <div className="card overflow-hidden">
        <div className="bg-ink p-6 text-on-ink sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-75">Test consegnato</p>
          <p className="mt-2 font-display text-4xl font-bold tabular-nums">
            {esito.punti.toLocaleString("it-IT")}
            <span className="text-xl opacity-60"> / {totale}</span>
          </p>
          <p className="mt-2 text-sm opacity-80">
            {esito.giuste} giuste · {esito.sbagliate} sbagliate · {esito.bianche} non date
          </p>
        </div>

        <div className="flex flex-col gap-4 p-6 sm:p-8">
          <p className="font-display text-xl font-bold">Materia per materia</p>
          <div className="flex flex-col gap-3">
            {esito.materie.map((m) => (
              <div key={m.subject} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{m.short}</span>
                  <span className="shrink-0 tabular-nums text-muted">
                    {m.giuste}/{m.domande} corrette
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className={`h-full rounded-full ${
                      m.giuste >= 12 ? "bg-green-500" : m.giuste >= 8 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.max((m.giuste / Math.max(1, m.domande)) * 100, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm leading-relaxed text-muted">
            Il risultato è già arrivato ai docenti. Non è un voto: serve a loro per sapere su che
            cosa insistere, e a te per sapere dove sei messo adesso — fra tre mesi questo foglio
            dovrà fare ridere.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Le soluzioni si vedono in aula, insieme: rivederle da soli serve molto meno che sentirsi
            spiegare perché la risposta che sembrava giusta non lo era.
          </p>
        </div>
      </div>
    </div>
  );
}
