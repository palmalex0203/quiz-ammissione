"use client";

/**
 * Il percorso completo della pagina pubblica: apertura, due campi, dodici
 * domande, risultato, richiesta del posto in diretta.
 *
 * Tutto sta in un componente solo, con lo stato in memoria, perché così le
 * risposte non viaggiano a ogni clic: partono una volta sola alla consegna.
 * È anche il modo di non incappare nel difetto noto della piattaforma — se la
 * rete salta a metà di una prova lunga le risposte si perdono — che su un
 * telefono in 4G, davanti a un visitatore che non ci conosce, sarebbe fatale.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Esito, OpenDayQuestion } from "@/lib/openday";
import { completaProfilo, consegna, registra } from "./azioni";

type Evento = {
  data: string;
  dataBreve: string;
  ora: string;
  piattaforma: string;
  url: string;
  postiTotali: number;
  titolare: string;
  urlInformativa: string;
};

type Fase = "apertura" | "prova" | "risultato";

const GUASTO = "Non siamo riusciti a parlare col server. Controlla la rete e riprova.";

/**
 * Chiama un'azione sul server senza lasciare che un'eccezione sfugga: se la
 * chiamata non arriva — rete caduta, server che non risponde — il componente
 * resterebbe in attesa per sempre col bottone bloccato. Su una pagina pubblica
 * con traffico a pagamento è il guasto che costa di più, perché non si vede nei
 * log e il visitatore se ne va senza dire niente.
 */
async function chiama<T>(azione: () => Promise<T>): Promise<T | { ok: false; errore: string }> {
  try {
    return await azione();
  } catch {
    return { ok: false, errore: GUASTO };
  }
}

export default function Simulazione({
  domande,
  minuti,
  totale,
  evento,
}: {
  domande: OpenDayQuestion[];
  minuti: number;
  totale: number;
  evento: Evento;
}) {
  const [fase, setFase] = useState<Fase>("apertura");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [scelte, setScelte] = useState<Record<string, string>>({});
  const [esito, setEsito] = useState<Esito | null>(null);

  const consegnaProva = useCallback(
    async (id: string, risposte: Record<string, string>): Promise<string | null> => {
      const r = await chiama(() =>
        consegna(
          id,
          domande.map((d) => ({ questionId: d.id, optionId: risposte[d.id] ?? null }))
        )
      );
      if (r.ok) {
        setEsito(r.esito);
        setFase("risultato");
        return null;
      }
      return r.errore;
    },
    [domande]
  );

  if (fase === "apertura") {
    return (
      <Apertura
        evento={evento}
        minuti={minuti}
        totale={totale}
        onPronto={(id) => {
          setLeadId(id);
          setFase("prova");
        }}
      />
    );
  }

  if (fase === "prova") {
    return (
      <Prova
        domande={domande}
        minuti={minuti}
        scelte={scelte}
        onScegli={(q, o) => setScelte((s) => ({ ...s, [q]: o }))}
        onConsegna={() => (leadId ? consegnaProva(leadId, scelte) : Promise.resolve(GUASTO))}
      />
    );
  }

  return <Risultato esito={esito} domande={domande} scelte={scelte} evento={evento} leadId={leadId} />;
}

/* ------------------------------------------------------------------ apertura */

function Apertura({
  evento,
  minuti,
  totale,
  onPronto,
}: {
  evento: Evento;
  minuti: number;
  totale: number;
  onPronto: (leadId: string) => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, setInCorso] = useState(false);

  async function invia(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    setInCorso(true);

    // Da quale inserzione è arrivato: si legge dall'indirizzo, non si chiede.
    const p = new URLSearchParams(window.location.search);
    const r = await chiama(() =>
      registra({
        nome,
        email,
        percorso: "SEMESTRE_FILTRO",
        utm: { source: p.get("utm_source"), medium: p.get("utm_medium"), campaign: p.get("utm_campaign") },
      })
    );

    setInCorso(false);
    if (r.ok) onPronto(r.leadId);
    else setErrore(r.errore);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <p className="pill pill-brand mb-4">Open day · {evento.dataBreve}, ore {evento.ora}</p>

      <h1 className="page-title text-4xl sm:text-5xl">
        Quanto faresti al test del semestre filtro?
      </h1>

      <p className="mt-4 text-lg text-muted">
        {totale} domande vere, prese dai due appelli del 2025/2026. {minuti}{" "}
        minuti, stesso punteggio dell&apos;esame: +1 se azzecchi, −0,1 se sbagli, 0 se lasci in bianco.
        La correzione è subito, gratis.
      </p>

      <form onSubmit={invia} className="card mt-8 p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="openday-nome" className="text-sm font-semibold">
            Come ti chiami
          </label>
          <input
            id="openday-nome"
            className="field"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="given-name"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="openday-email" className="text-sm font-semibold">
            La tua email
          </label>
          <input
            id="openday-email"
            className="field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <p className="text-xs text-muted">Ti mandiamo lì il risultato, così lo ritrovi.</p>
        </div>

        {errore && <p className="text-sm text-red-700 dark:text-red-400">{errore}</p>}

        <button type="submit" className="btn btn-brand w-full py-3 text-base" disabled={inCorso}>
          {inCorso ? "Un attimo…" : "Inizia la simulazione"}
        </button>

        <p className="text-xs text-muted leading-relaxed">
          Usiamo nome ed email solo per farti svolgere la simulazione e mandarti il risultato.
          Titolare del trattamento: {evento.titolare}.{" "}
          {evento.urlInformativa && (
            <a className="underline" href={evento.urlInformativa} target="_blank" rel="noreferrer">
              Informativa privacy
            </a>
          )}
        </p>
      </form>
    </div>
  );
}

/* --------------------------------------------------------------------- prova */

function Prova({
  domande,
  minuti,
  scelte,
  onScegli,
  onConsegna,
}: {
  domande: OpenDayQuestion[];
  minuti: number;
  scelte: Record<string, string>;
  onScegli: (questionId: string, optionId: string) => void;
  onConsegna: () => Promise<string | null>;
}) {
  const [secondi, setSecondi] = useState(minuti * 60);
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, setInCorso] = useState(false);
  const consegnato = useRef(false);

  const consegnaOra = useCallback(async () => {
    if (consegnato.current) return;
    consegnato.current = true;
    setInCorso(true);
    setErrore(null);

    const e = await onConsegna();

    setInCorso(false);
    if (e) {
      // Riaprire la consegna è l'unica cosa che conta: le risposte sono ancora
      // tutte in memoria, e una prova svolta e persa non si recupera più.
      consegnato.current = false;
      setErrore(e);
    }
  }, [onConsegna]);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondi((s) => {
        if (s <= 1) {
          clearInterval(t);
          consegnaOra();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [consegnaOra]);

  const date = Object.keys(scelte).length;
  const mm = String(Math.floor(secondi / 60)).padStart(2, "0");
  const ss = String(secondi % 60).padStart(2, "0");
  const agliSgoccioli = secondi <= 120;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-line bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted tabular-nums">
            {date} di {domande.length}
          </span>
          <span
            className={`font-display text-lg font-bold tabular-nums ${
              agliSgoccioli ? "text-red-700 dark:text-red-400" : ""
            }`}
            aria-label="tempo rimasto"
          >
            {mm}:{ss}
          </span>
        </div>
        <div className="mt-2 h-1 rounded-full bg-line">
          <div
            className="h-1 rounded-full bg-brand transition-[width] duration-300"
            style={{ width: `${(date / domande.length) * 100}%` }}
          />
        </div>
      </div>

      <ol className="flex flex-col gap-5">
        {domande.map((d, i) => (
          <li key={d.id} className="card p-5">
            <p className="pill pill-brand mb-3">
              {i + 1} · {d.short}
            </p>
            <p className="font-semibold leading-snug">{d.text}</p>

            <div className="mt-4 flex flex-col gap-2">
              {d.options.map((o, j) => {
                const scelta = scelte[d.id] === o.id;
                return (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      scelta
                        ? "border-brand bg-brand-tint"
                        : "border-control-line hover:border-brand/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name={d.id}
                      className="sr-only"
                      checked={scelta}
                      onChange={() => onScegli(d.id, o.id)}
                    />
                    <span
                      className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                        scelta ? "border-brand bg-brand text-white" : "border-control-line"
                      }`}
                      aria-hidden
                    >
                      {"ABCDE"[j]}
                    </span>
                    <span>{o.text}</span>
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <button onClick={consegnaOra} className="btn btn-brand mt-8 w-full py-3 text-base" disabled={inCorso}>
        {inCorso ? "Sto correggendo…" : errore ? "Riprova a consegnare" : "Consegna e vedi il risultato"}
      </button>
      {errore && (
        <p className="mt-2 text-center text-sm text-red-700 dark:text-red-400">
          {errore} Le tue risposte sono ancora qui: non chiudere la pagina.
        </p>
      )}
      {!errore && date < domande.length && (
        <p className="mt-2 text-center text-xs text-muted">
          Puoi consegnare anche così: le domande lasciate in bianco valgono zero, non tolgono punti.
        </p>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- risultato */

function Risultato({
  esito,
  domande,
  scelte,
  evento,
  leadId,
}: {
  esito: Esito | null;
  domande: OpenDayQuestion[];
  scelte: Record<string, string>;
  evento: Evento;
  leadId: string | null;
}) {
  const perId = useMemo(() => new Map(domande.map((d) => [d.id, d])), [domande]);

  if (!esito) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="skeleton h-40" />
      </div>
    );
  }

  const percentuale = Math.round((esito.giuste / Math.max(1, esito.giuste + esito.sbagliate + esito.bianche)) * 100);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="page-title">Ecco com&apos;è andata</h1>

      <div className="card mt-5 p-6">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-5xl font-bold tabular-nums">
            {esito.punti.toLocaleString("it-IT")}
          </span>
          <span className="text-xl text-muted">/ {esito.massimo}</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {esito.giuste} {esito.giuste === 1 ? "giusta" : "giuste"} · {esito.sbagliate}{" "}
          {esito.sbagliate === 1 ? "sbagliata" : "sbagliate"} · {esito.bianche} in bianco — {percentuale}% di
          risposte esatte
        </p>

        <div className="mt-5 flex flex-col gap-3">
          {esito.perMateria.map((m) => (
            <div key={m.subject}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{m.short}</span>
                <span className="tabular-nums text-muted">
                  {m.giuste}/{m.domande}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-line">
                <div
                  className="h-2 rounded-full bg-brand"
                  style={{ width: `${(m.giuste / Math.max(1, m.domande)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <InvitoDiretta evento={evento} leadId={leadId} />

      <h2 className="section-title mt-10">Domanda per domanda</h2>
      <ol className="mt-3 flex flex-col gap-3">
        {esito.dettaglio.map((r, i) => {
          const d = perId.get(r.questionId);
          if (!d) return null;
          const mia = d.options.find((o) => o.id === scelte[d.id]);
          const giusta = d.options.find((o) => o.id === r.corretta);
          return (
            <li key={r.questionId} className="card p-4">
              <p className="text-sm font-semibold leading-snug">
                {i + 1}. {d.text}
              </p>
              <p className="mt-2 text-sm">
                <span className={r.giusta ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}>
                  {r.giusta ? "Giusta" : mia ? "Sbagliata" : "Lasciata in bianco"}
                </span>
                {!r.giusta && giusta && <> — la risposta è: <strong>{giusta.text}</strong></>}
              </p>
              {!r.giusta && mia && <p className="text-xs text-muted">Avevi scelto: {mia.text}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------ invito diretta */

function InvitoDiretta({ evento, leadId }: { evento: Evento; leadId: string | null }) {
  const [telefono, setTelefono] = useState("");
  const [scuola, setScuola] = useState("");
  const [anno, setAnno] = useState("");
  const [consenso, setConsenso] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [fatto, setFatto] = useState<{ postiRimasti: number } | null>(null);

  async function invia(e: React.FormEvent) {
    e.preventDefault();
    if (!leadId) return;
    setInCorso(true);
    setErrore(null);

    const r = await chiama(() =>
      completaProfilo(
        leadId,
        { telefono, scuola, anno, consensoMarketing: consenso, postoDiretta: true },
        evento.postiTotali
      )
    );

    setInCorso(false);
    if (r.ok) setFatto({ postiRimasti: r.postiRimasti });
    else setErrore(r.errore);
  }

  if (fatto) {
    return (
      <div className="card mt-6 border-brand/40 bg-brand-tint p-6">
        <h2 className="section-title">Il posto è tuo</h2>
        <p className="mt-2 text-sm">
          Ci vediamo {evento.data} alle {evento.ora} su {evento.piattaforma}. Il collegamento ti arriva
          per email, e te lo ricordiamo il giorno prima.
        </p>
        {evento.url && (
          <a href={evento.url} target="_blank" rel="noreferrer" className="btn btn-brand mt-4">
            Entra nella diretta
          </a>
        )}
        <p className="mt-3 text-xs text-muted">Restano {fatto.postiRimasti} posti.</p>
      </div>
    );
  }

  return (
    <form onSubmit={invia} className="card mt-6 border-brand/40 p-6">
      <h2 className="section-title">Vuoi la correzione commentata e il piano di studio?</h2>
      <p className="mt-2 text-sm text-muted">
        {evento.data}, alle {evento.ora}, in diretta: riprendiamo queste domande una per una e
        vediamo come si studia per arrivarci. I posti sono limitati.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="od-tel" className="text-sm font-semibold">Telefono</label>
          <input id="od-tel" className="field" value={telefono} onChange={(e) => setTelefono(e.target.value)} autoComplete="tel" inputMode="tel" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="od-anno" className="text-sm font-semibold">A che punto sei</label>
          <select id="od-anno" className="field" value={anno} onChange={(e) => setAnno(e.target.value)}>
            <option value="">Scegli…</option>
            <option>Quarto anno</option>
            <option>Quinto anno</option>
            <option>Diplomato</option>
            <option>Già all&apos;università</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="od-scuola" className="text-sm font-semibold">Scuola o città</label>
          <input id="od-scuola" className="field" value={scuola} onChange={(e) => setScuola(e.target.value)} />
        </div>
      </div>

      <label className="mt-4 flex items-start gap-2.5 text-xs text-muted">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={consenso}
          onChange={(e) => setConsenso(e.target.checked)}
        />
        <span>
          Acconsento a essere ricontattato da {evento.titolare}{" "}
          per informazioni sui corsi. È facoltativo: il posto in diretta te lo teniamo comunque.
        </span>
      </label>

      {errore && <p className="mt-3 text-sm text-red-700 dark:text-red-400">{errore}</p>}

      <button type="submit" className="btn btn-brand mt-4 w-full py-3 text-base" disabled={inCorso}>
        {inCorso ? "Un attimo…" : errore ? "Riprova" : "Prenota il posto"}
      </button>
    </form>
  );
}
