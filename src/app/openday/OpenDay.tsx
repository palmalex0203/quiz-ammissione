"use client";

/**
 * La pagina pubblica dell'open day: l'invito, la simulazione di una prova
 * ufficiale intera, il risultato.
 *
 * Due scelte che reggono tutto il resto:
 *
 *  - **il contatto si salva prima che la prova cominci.** Sono 93 domande e più
 *    di due ore: la maggior parte non arriverà in fondo, e sono proprio quelli
 *    che non vanno persi;
 *  - **le risposte restano nel browser** e vanno al server una volta sola, alla
 *    consegna di ciascuna prova. Su una rete mobile, salvare a ogni tocco
 *    significa perdere tutto quando la linea cade — ed è un difetto che questa
 *    piattaforma ha già avuto. In più si tengono in locale, così ricaricare la
 *    pagina per sbaglio non cancella due ore di lavoro.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OpenDayQuestion, Esito, Prova } from "@/lib/openday";
import { TRACKS } from "@/lib/tracks";
import { votoProva } from "@/lib/esame";
import { consegna, iniziaSimulazione, iscrivitiAllOpenDay } from "./azioni";

type Evento = {
  titolo: string;
  titoloGrande: { riga1: string; riga2: string };
  slogan: string;
  data: string;
  dataBreve: string;
  ora: string;
  durata: string;
  piattaforma: string;
  url: string;
  postiTotali: number;
  titolare: string;
  urlInformativa: string;
};

type Esame = { domandePerProva: number; minutiPerProva: number; totale: number };

const GUASTO = "Non siamo riusciti a parlare col server. Controlla la rete e riprova.";

async function chiama<T>(azione: () => Promise<T>): Promise<T | { ok: false; errore: string }> {
  try {
    return await azione();
  } catch {
    return { ok: false, errore: GUASTO };
  }
}

function utmDaIndirizzo() {
  const p = new URLSearchParams(window.location.search);
  return { source: p.get("utm_source"), medium: p.get("utm_medium"), campaign: p.get("utm_campaign") };
}

/* ------------------------------------------------------------------ pagina */

type Fase = "apertura" | "prova" | "risultato";

export default function OpenDay({ prova, esame, evento }: { prova: Prova; esame: Esame; evento: Evento }) {
  const [fase, setFase] = useState<Fase>("apertura");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [esito, setEsito] = useState<Esito | null>(null);

  if (fase === "prova" && leadId) {
    return (
      <Prova
        prova={prova}
        esame={esame}
        leadId={leadId}
        onFinita={(e) => {
          setEsito(e);
          setFase("risultato");
        }}
      />
    );
  }

  if (fase === "risultato" && esito) {
    return <Risultato esito={esito} esame={esame} evento={evento} />;
  }

  return (
    <Apertura
      evento={evento}
      esame={esame}
      prova={prova}
      onParte={(id) => {
        setLeadId(id);
        setFase("prova");
      }}
    />
  );
}

/* ---------------------------------------------------------------- apertura */

/**
 * Quale dei due moduli è aperto.
 *
 * Mai tutti e due insieme: due moduli identici — nome, telefono, email — uno
 * sotto l'altro erano la cosa più confusa della pagina, perché chi arriva non
 * capisce quale dei due lo riguarda. Qui si vede un modulo solo, quello della
 * strada che si è scelta, e l'altra resta un riquadro da aprire.
 */
type Modulo = "partecipa" | "simula";

function Apertura({
  evento,
  esame,
  prova,
  onParte,
}: {
  evento: Evento;
  esame: Esame;
  prova: Prova;
  onParte: (leadId: string) => void;
}) {
  // A pagina ferma è aperto l'open day: è il motivo per cui la pagina esiste.
  const [aperto, setAperto] = useState<Modulo>("partecipa");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 pb-20">
      <Testata evento={evento} />
      <Partecipa evento={evento} aperto={aperto === "partecipa"} apri={() => setAperto("partecipa")} />
      <Simulazione
        evento={evento}
        esame={esame}
        prova={prova}
        onParte={onParte}
        aperto={aperto === "simula"}
        apri={() => setAperto("simula")}
      />
    </div>
  );
}

/* ----------------------------------------------------------------- testata */

/**
 * Il titolo grande e i quattro dati dell'evento.
 *
 * Il nome dell'evento sta in cima e grosso: chi arriva da un annuncio deve
 * capire in un'occhiata di cosa si tratta, prima ancora di leggere la frase.
 * Quando, quanto dura, dove e quanto costa sono le quattro cose che si cercano
 * subito: messe in riga si leggono senza attraversare un paragrafo.
 */
function Testata({ evento }: { evento: Evento }) {
  const fatti = [
    { voce: "Quando", valore: `${evento.dataBreve}, ${evento.ora}` },
    { voce: "Quanto dura", valore: evento.durata },
    { voce: "Dove", valore: `In diretta su ${evento.piattaforma}` },
    { voce: "Quanto costa", valore: "Gratuito" },
  ];

  return (
    <header className="pb-3 pt-2">
      <p className="pill pill-brand">In diretta {evento.dataBreve}</p>

      <h1 className="mt-4 font-display font-bold leading-[0.92] tracking-tight text-balance">
        <span className="block text-[2.6rem] text-brand-strong sm:text-6xl">{evento.titoloGrande.riga1}</span>
        <span className="block text-[2.6rem] sm:text-6xl">{evento.titoloGrande.riga2}</span>
      </h1>

      <p className="mt-5 font-display text-xl font-bold tracking-tight text-balance sm:text-2xl">
        {evento.slogan}
      </p>
      <p className="mt-2 leading-relaxed text-muted">
        Due ore per capire com&apos;è fatto il test che decide chi resta a medicina: le prove, il
        punteggio, il programma. E per provarlo davvero, con la prova ufficiale dell&apos;anno
        scorso.
      </p>

      {/* gap-px su fondo colorato: i divisori sono i buchi fra le celle, così
          restano sottili come una riga a qualunque densità di schermo. */}
      <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
        {fatti.map((f) => (
          <div key={f.voce} className="bg-card px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{f.voce}</dt>
            <dd className="mt-1 text-sm font-semibold leading-snug">{f.valore}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}

/* --------------------------------------------------------------- partecipa */

function Partecipa({ evento, aperto, apri }: { evento: Evento; aperto: boolean; apri: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [fatto, setFatto] = useState<{ postiRimasti: number } | null>(null);

  async function invia(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    setInCorso(true);

    const r = await chiama(() =>
      iscrivitiAllOpenDay({ nome, email, telefono, utm: utmDaIndirizzo() }, evento.postiTotali)
    );

    setInCorso(false);
    if (r.ok) setFatto({ postiRimasti: r.postiRimasti });
    else setErrore(r.errore);
  }

  const punti = [
    "Com'è fatto il test: tre prove, 31 domande ciascuna, 45 minuti l'una.",
    "Come funziona il punteggio, e quanto serve davvero per passare.",
    "Quali materie si affrontano e come organizzare lo studio da qui all'esame.",
    "Le vostre domande, e la correzione in diretta di alcune domande della simulazione.",
  ];

  return (
    <section className={`card overflow-hidden ${aperto ? "border-brand/50" : ""}`}>
      <div className="border-b border-line bg-brand-tint px-5 py-5 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-strong">L&apos;evento</p>
        <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-balance">
          Vieni all&apos;open day
        </h2>
        <p className="mt-1 text-sm text-muted">
          {evento.data}, dalle {evento.ora}. Primo giorno del corso di preparazione.
        </p>
      </div>

      <div className="p-5 sm:p-7">
        {fatto ? (
          <div className="rounded-2xl bg-brand-tint p-5">
            <p className="section-title">Ci sei</p>
            <p className="mt-1.5 text-sm leading-relaxed">
              Ci vediamo {evento.data} alle {evento.ora} su {evento.piattaforma}. Il collegamento ti
              arriva per email, e te lo ricordiamo il giorno prima.
            </p>
            {evento.url && (
              <a href={evento.url} target="_blank" rel="noreferrer" className="btn btn-brand mt-4">
                Entra nella diretta
              </a>
            )}
            <p className="mt-3 text-xs text-muted">Restano {fatto.postiRimasti} posti.</p>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-2.5">
              {punti.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm leading-relaxed">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>

            {aperto ? (
              <form onSubmit={invia} className="mt-6 flex flex-col gap-3 border-t border-line pt-6">
                <Campi
                  prefisso="part"
                  nome={nome}
                  setNome={setNome}
                  telefono={telefono}
                  setTelefono={setTelefono}
                  email={email}
                  setEmail={setEmail}
                />
                {errore && <p className="text-sm text-red-700 dark:text-red-400">{errore}</p>}
                <button type="submit" className="btn btn-brand w-full py-3.5 text-base" disabled={inCorso}>
                  {inCorso ? "Un attimo…" : errore ? "Riprova" : "Prenota il posto"}
                </button>
                <p className="text-center text-xs text-muted">
                  I posti sono limitati: la diretta si apre a chi si è registrato.
                </p>
                <Privacy evento={evento} uso="per tenerti il posto e mandarti il collegamento" />
              </form>
            ) : (
              <button type="button" onClick={apri} className="btn btn-brand mt-6 w-full py-3.5 text-base">
                Prenota il posto
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- simulazione */

function Simulazione({
  evento,
  esame,
  prova,
  onParte,
  aperto,
  apri,
}: {
  evento: Evento;
  esame: Esame;
  prova: Prova;
  onParte: (leadId: string) => void;
  aperto: boolean;
  apri: () => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function invia(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    setInCorso(true);

    const r = await chiama(() =>
      iniziaSimulazione({ nome, email, telefono, utm: utmDaIndirizzo() }, prova.appello)
    );

    setInCorso(false);
    if (r.ok) onParte(r.leadId);
    else setErrore(r.errore);
  }

  const ore = Math.floor((esame.minutiPerProva * 3) / 60);
  const minuti = (esame.minutiPerProva * 3) % 60;

  const numeri = [
    { n: String(esame.totale), che: "domande" },
    { n: "3", che: `prove da ${esame.minutiPerProva} min` },
    { n: `${ore}h ${minuti}`, che: "in tutto" },
  ];

  const punteggio = [
    { segno: "+1", quando: "giusta" },
    { segno: "−0,1", quando: "sbagliata" },
    { segno: "0", quando: "in bianco" },
  ];

  return (
    <section className={`card overflow-hidden ${aperto ? "border-brand/50" : ""}`}>
      {/* Fascia scura: è l'altra metà della pagina, e si deve vedere a colpo
          d'occhio che è un'altra cosa dall'invito qui sopra. */}
      <div className="bg-ink px-5 py-5 text-on-ink sm:px-7">
        <p className="text-xs font-bold uppercase tracking-widest opacity-60">La prova</p>
        <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-balance">
          Prova il test vero, adesso
        </h2>
        <p className="mt-1 text-sm opacity-75">
          La prova ufficiale del semestre filtro 2025/2026, intera e gratuita.
        </p>
      </div>

      <div className="p-5 sm:p-7">
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line text-center">
          {numeri.map((v) => (
            <div key={v.che} className="bg-card px-2 py-3">
              <p className="font-display text-2xl font-bold tabular-nums sm:text-3xl">{v.n}</p>
              <p className="mt-0.5 text-xs leading-snug text-muted">{v.che}</p>
            </div>
          ))}
        </div>

        <p className="mt-5 text-sm leading-relaxed text-muted">
          Le tre materie una dopo l&apos;altra come all&apos;esame, con il cronometro. Quindici
          domande a scelta multipla e sedici a completamento per prova, e il punteggio vero:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {punteggio.map((p) => (
            <span key={p.quando} className="pill bg-brand-soft text-brand-strong">
              <span className="tabular-nums">{p.segno}</span> {p.quando}
            </span>
          ))}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted">
          Alla fine vedi il punteggio e il voto di ogni prova. Alcune delle domande le correggiamo
          insieme, in diretta, il {evento.dataBreve}.
        </p>

        {aperto ? (
          <form onSubmit={invia} className="mt-6 flex flex-col gap-3 border-t border-line pt-6">
            <Campi
              prefisso="sim"
              nome={nome}
              setNome={setNome}
              telefono={telefono}
              setTelefono={setTelefono}
              email={email}
              setEmail={setEmail}
            />
            {errore && <p className="text-sm text-red-700 dark:text-red-400">{errore}</p>}
            <button type="submit" className="btn btn-ink w-full py-3.5 text-base" disabled={inCorso}>
              {inCorso ? "Preparo la prova…" : errore ? "Riprova" : "Inizia la simulazione"}
            </button>
            <p className="text-center text-xs text-muted">
              Parte il cronometro, come all&apos;esame. Puoi fermarti quando vuoi.
            </p>
            <Privacy evento={evento} uso="per farti svolgere la simulazione e ricontattarti sui corsi" />
          </form>
        ) : (
          <button type="button" onClick={apri} className="btn btn-ink mt-6 w-full py-3.5 text-base">
            Inizia la simulazione
          </button>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ campi comuni */

function Campi({
  prefisso,
  nome,
  setNome,
  telefono,
  setTelefono,
  email,
  setEmail,
}: {
  prefisso: string;
  nome: string;
  setNome: (v: string) => void;
  telefono: string;
  setTelefono: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
}) {
  return (
    <>
      {/* Nome e telefono affiancati anche sul telefono: incolonnati, spingono il
          bottone sotto il bordo dello schermo, e quello che non si vede non si
          tocca. A 375 px restano 155 px per campo, che bastano. */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${prefisso}-nome`} className="text-sm font-semibold">
            Nome e cognome
          </label>
          <input
            id={`${prefisso}-nome`}
            className="field"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="name"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${prefisso}-tel`} className="text-sm font-semibold">
            Telefono
          </label>
          <input
            id={`${prefisso}-tel`}
            className="field"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${prefisso}-email`} className="text-sm font-semibold">
          Email
        </label>
        <input
          id={`${prefisso}-email`}
          className="field"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>
    </>
  );
}

function Privacy({ evento, uso }: { evento: Evento; uso: string }) {
  return (
    <p className="text-xs leading-relaxed text-muted">
      Usiamo questi dati {uso}. Titolare del trattamento: {evento.titolare}.{" "}
      {evento.urlInformativa && (
        <a className="underline" href={evento.urlInformativa} target="_blank" rel="noreferrer">
          Informativa privacy
        </a>
      )}
    </p>
  );
}

/* -------------------------------------------------------------------- prova */

type Risposte = Record<string, { optionId?: string; testo?: string }>;

const CHIAVE_LOCALE = "openday-prova";

type StatoProva = { sezione: number; risposte: Risposte };

/**
 * Quello che era stato risposto prima di un ricaricamento. Si legge al primo
 * render e non dentro un effetto: la prova compare solo dopo un clic, quindi
 * questo componente non viene mai disegnato sul server e `localStorage` c'è
 * sempre. In finestra anonima, con lo spazio pieno o i cookie bloccati, la
 * lettura fallisce e si riparte da zero senza rompere niente.
 */
function ripristina(appello: string): StatoProva {
  try {
    const salvato = localStorage.getItem(`${CHIAVE_LOCALE}-${appello}`);
    if (salvato) {
      const d = JSON.parse(salvato) as Partial<StatoProva>;
      return { sezione: d.sezione ?? 0, risposte: d.risposte ?? {} };
    }
  } catch {
    // Si riparte da zero.
  }
  return { sezione: 0, risposte: {} };
}

function Prova({
  prova,
  esame,
  leadId,
  onFinita,
}: {
  prova: Prova;
  esame: Esame;
  leadId: string;
  onFinita: (esito: Esito) => void;
}) {
  // Ricaricare la pagina per sbaglio, dopo un'ora di prova, sarebbe un disastro:
  // quello che è stato risposto resta nel browser.
  const [stato, setStato] = useState<StatoProva>(() => ripristina(prova.appello));
  const { sezione, risposte } = stato;
  const [secondi, setSecondi] = useState(esame.minutiPerProva * 60);
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const consegnata = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(`${CHIAVE_LOCALE}-${prova.appello}`, JSON.stringify(stato));
    } catch {
      // Se non si può salvare, la prova continua lo stesso.
    }
  }, [prova.appello, stato]);

  const ultima = sezione === prova.sezioni.length - 1;

  const consegnaTutto = useCallback(async () => {
    if (consegnata.current) return;
    consegnata.current = true;
    setInCorso(true);
    setErrore(null);

    const elenco = Object.entries(risposte).map(([questionId, r]) => ({
      questionId,
      optionId: r.optionId ?? null,
      testo: r.testo ?? null,
    }));

    const r = await chiama(() => consegna(leadId, prova.appello, elenco));
    setInCorso(false);

    if (r.ok) {
      try {
        localStorage.removeItem(`${CHIAVE_LOCALE}-${prova.appello}`);
      } catch {
        // Niente: è solo pulizia.
      }
      onFinita(r.esito);
    } else {
      // Le risposte sono ancora tutte qui: si può ritentare senza rifare nulla.
      consegnata.current = false;
      setErrore(r.errore);
    }
  }, [leadId, onFinita, prova.appello, risposte]);

  const avanti = useCallback(() => {
    if (ultima) {
      void consegnaTutto();
    } else {
      setStato((st) => ({ ...st, sezione: st.sezione + 1 }));
      setSecondi(esame.minutiPerProva * 60);
      window.scrollTo({ top: 0 });
    }
  }, [consegnaTutto, esame.minutiPerProva, ultima]);

  // Il cronometro di ciascuna prova. Allo scadere si passa alla successiva, come
  // all'esame: lì il tempo di una materia non si può prestare a un'altra.
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
  const date = domande.filter((d) => {
    const r = risposte[d.id];
    return d.completamento ? (r?.testo ?? "").trim() !== "" : Boolean(r?.optionId);
  }).length;

  const mm = String(Math.floor(secondi / 60)).padStart(2, "0");
  const ss = String(secondi % 60).padStart(2, "0");
  const agliSgoccioli = secondi <= 300;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-line bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-sm font-semibold">
            {corrente.short}
            <span className="font-normal text-muted"> · prova {sezione + 1} di {prova.sezioni.length}</span>
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
          <span className="shrink-0 text-xs text-muted tabular-nums">
            {date}/{domande.length}
          </span>
        </div>
      </div>

      <ol className="flex flex-col gap-5">
        {domande.map((d, i) => (
          <Domanda
            key={d.id}
            numero={i + 1}
            domanda={d}
            risposta={risposte[d.id]}
            onRispondi={(r) =>
              setStato((st) => ({ ...st, risposte: { ...st.risposte, [d.id]: { ...st.risposte[d.id], ...r } } }))
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
              ? "Consegna e vedi il risultato"
              : `Consegna e passa a ${prova.sezioni[sezione + 1].short}`}
      </button>

      {errore ? (
        <p className="mt-2 text-center text-sm text-red-700 dark:text-red-400">
          {errore} Le tue risposte sono ancora qui: non chiudere la pagina.
        </p>
      ) : (
        <p className="mt-2 text-center text-xs text-muted">
          {ultima
            ? "Le domande lasciate in bianco valgono zero, non tolgono punti."
            : "Come all'esame, una prova consegnata non si riapre."}
        </p>
      )}
    </div>
  );
}

function Domanda({
  numero,
  domanda,
  risposta,
  onRispondi,
}: {
  numero: number;
  domanda: OpenDayQuestion;
  risposta?: { optionId?: string; testo?: string };
  onRispondi: (r: { optionId?: string; testo?: string }) => void;
}) {
  return (
    <li className="card p-5">
      <p className="pill pill-brand mb-3">
        {numero} · {domanda.completamento ? "completamento" : "scelta multipla"}
      </p>
      <p className="font-semibold leading-snug">{domanda.text}</p>

      {domanda.completamento ? (
        <div className="mt-4">
          <input
            className="field w-full font-mono"
            value={risposta?.testo ?? ""}
            onChange={(e) => onRispondi({ testo: e.target.value })}
            maxLength={16}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-label={`Risposta alla domanda ${numero}`}
            placeholder="scrivi qui la risposta"
          />
          <p className="mt-1.5 text-xs text-muted">
            Una parola, massimo 16 caratteri. All&apos;esame un errore di ortografia la annulla.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {domanda.options.map((o, j) => {
            const scelta = risposta?.optionId === o.id;
            return (
              <label
                key={o.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  scelta ? "border-brand bg-brand-tint" : "border-control-line hover:border-brand/40"
                }`}
              >
                <input
                  type="radio"
                  name={domanda.id}
                  className="sr-only"
                  checked={scelta}
                  onChange={() => onRispondi({ optionId: o.id })}
                />
                <span
                  aria-hidden
                  className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                    scelta ? "border-brand bg-brand text-white" : "border-control-line"
                  }`}
                >
                  {"ABCDE"[j]}
                </span>
                <span>{o.text}</span>
              </label>
            );
          })}
        </div>
      )}
    </li>
  );
}

/* ---------------------------------------------------------------- risultato */

function Risultato({ esito, esame, evento }: { esito: Esito; esame: Esame; evento: Evento }) {
  const track = TRACKS.SEMESTRE_FILTRO;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-16">
      <div>
        <h1 className="page-title">Ecco com&apos;è andata</h1>
        <p className="mt-1 text-sm text-muted">
          Prova ufficiale del semestre filtro — {esito.etichetta}. All&apos;esame ogni materia fa
          voto a sé: sommare i tre punteggi non vorrebbe dire niente.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {esito.prove.map((p) => {
          const voto = votoProva(p.punti, track);
          return (
            <div key={p.subject} className="card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-display text-lg font-bold tracking-tight">{p.short}</span>
                {voto && (
                  <span
                    className={`pill ${
                      voto.superata
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                    }`}
                  >
                    {voto.etichetta}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">
                {p.giuste} {p.giuste === 1 ? "giusta" : "giuste"} · {p.sbagliate}{" "}
                {p.sbagliate === 1 ? "sbagliata" : "sbagliate"} · {p.bianche} in bianco — {p.punti}{" "}
                punti su {esame.domandePerProva}
              </p>
              <div className="mt-3 h-2 rounded-full bg-line">
                <div
                  className="h-2 rounded-full bg-brand"
                  style={{ width: `${(p.giuste / Math.max(1, p.domande)) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="card border-brand/40 bg-brand-tint p-5 sm:p-6">
        <h2 className="section-title">La correzione la facciamo insieme</h2>
        <p className="mt-2 text-sm">
          {evento.data} alle {evento.ora}, in diretta su {evento.piattaforma}: {evento.durata}{" "}
          sul semestre filtro — com&apos;è fatto il test, come funziona il punteggio, quali materie si
          affrontano — e commentiamo alcune delle domande che hai appena svolto, spiegando perché la
          risposta è quella.
        </p>
        {evento.url && (
          <a href={evento.url} target="_blank" rel="noreferrer" className="btn btn-brand mt-4">
            Entra nella diretta
          </a>
        )}
        <p className="mt-3 text-xs text-muted">
          Il collegamento ti arriva per email: i tuoi dati li abbiamo già.
        </p>
      </div>
    </div>
  );
}
