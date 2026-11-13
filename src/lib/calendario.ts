import { configMicrosoft, graph, type ConfigMicrosoft } from "@/lib/microsoft";
import { urlDirettaValido } from "@/lib/lezioni";

/*
 * Le riunioni in programma sul calendario del team.
 *
 * A cosa serve: le lezioni si fissano su Teams, non qui. Finora la stessa
 * lezione si scriveva due volte — una su Teams e una a mano nell'area
 * insegnante, incollando il link — e il punto dove si sbaglia è sempre quello:
 * un link incollato male manda la classe da un'altra parte, e l'errore si
 * scopre a lezione iniziata. Da qui invece la lezione nasce già compilata, col
 * link ufficiale di Microsoft.
 *
 * Si legge il calendario del *team*, non quello del docente: in quel calendario
 * ci sono solo le riunioni del percorso, mentre in quello personale ci
 * sarebbero anche i suoi appuntamenti, che non ci riguardano. Per questo basta
 * il permesso Group.Read.All e non serve leggere la posta di nessuno.
 *
 * Importare non è pubblicare. La riunione diventa una lezione in bozza, con la
 * materia scelta dal docente e il titolo riscritto come lo leggono gli
 * studenti: «LEZIONE 2 FISICA» va bene fra colleghi, in pagina no. E sul
 * calendario del team finiscono anche riunioni che non sono lezioni: a decidere
 * quali diventano lezioni resta una persona.
 */

/** Da quanti giorni indietro si guarda: una lezione di ieri si può ancora caricare. */
const GIORNI_INDIETRO = 14;

/** Fin dove si guarda avanti. */
const GIORNI_AVANTI = 90;

export type RiunioneCalendario = {
  /**
   * L'identificativo della riunione sul calendario. Resta lo stesso se la
   * riunione viene spostata, ed è quello che segna una lezione come già
   * importata: senza, la stessa riunione si potrebbe caricare due volte.
   */
  chiave: string;
  /** Il titolo come l'ha scritto chi ha creato la riunione su Teams. */
  titolo: string;
  /** Quando comincia. */
  inizio: Date;
  durataMinuti: number | null;
  /** Il link di partecipazione, nella forma ufficiale di Microsoft. */
  urlDiretta: string;
};

type EventoGraph = {
  id?: string;
  iCalUId?: string;
  subject?: string | null;
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  isCancelled?: boolean;
  type?: string;
  onlineMeeting?: { joinUrl?: string | null } | null;
};

export function calendarioAttivo(): boolean {
  const c = configMicrosoft();
  return c !== null && c.raccolta !== null;
}

/*
 * Il gruppo del team si ricava dalla raccolta documenti, invece di chiederlo
 * come ennesima variabile d'ambiente da copiare a mano: la raccolta la
 * conosciamo già, e lei sa a quale gruppo appartiene. Si chiede una volta e si
 * tiene da parte, perché non cambia mai.
 */
let gruppo: string | null = null;

async function gruppoDelTeam(c: ConfigMicrosoft): Promise<string | null> {
  if (gruppo) return gruppo;
  if (!c.raccolta) return null;

  const r = await graph<{ owner?: { group?: { id?: string } } }>(
    c,
    `/drives/${encodeURIComponent(c.raccolta)}?$select=id,owner`
  );
  gruppo = r.owner?.group?.id ?? null;
  return gruppo;
}

/** Gli orari arrivano in UTC: «2026-11-12T15:00:00.0000000», senza la Z finale. */
function istanteUtc(q: { dateTime?: string; timeZone?: string } | undefined): Date | null {
  if (!q?.dateTime) return null;
  const d = new Date(q.timeZone === "UTC" ? `${q.dateTime}Z` : q.dateTime);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Le riunioni in programma sul calendario del team, dalla più vicina.
 *
 * Non si mette in cache: un docente che ha appena fissato la lezione su Teams
 * apre la pagina per caricarla, e una lista vecchia di cinque minuti sarebbe
 * una lista senza la riunione che sta cercando. È una domanda a Microsoft, non
 * al database: non si paga a tempo.
 */
export async function riunioniInCalendario(): Promise<RiunioneCalendario[]> {
  const c = configMicrosoft();
  if (!c) return [];

  const id = await gruppoDelTeam(c);
  if (!id) return [];

  const da = new Date(Date.now() - GIORNI_INDIETRO * 86_400_000).toISOString();
  const a = new Date(Date.now() + GIORNI_AVANTI * 86_400_000).toISOString();
  // isOnlineMeeting va chiesto per forza: senza di lui Graph restituisce
  // onlineMeeting vuoto, e quindi nessun link. Non è documentato: si vede
  // solo provandolo.
  const campi =
    "id,iCalUId,subject,start,end,isCancelled,type,isOnlineMeeting,onlineMeeting";

  const r = await graph<{ value: EventoGraph[] }>(
    c,
    `/groups/${encodeURIComponent(id)}/calendarView` +
      `?startDateTime=${da}&endDateTime=${a}` +
      `&$select=${campi}&$orderby=start/dateTime&$top=100`,
    // Senza questo ogni risposta arriverebbe nel fuso del calendario: così gli
    // orari sono sempre UTC e la conversione è una sola, qui sotto.
    { headers: { prefer: 'outlook.timezone="UTC"' } }
  );

  const riunioni: RiunioneCalendario[] = [];

  for (const e of r.value ?? []) {
    if (e.isCancelled) continue;
    // calendarView restituisce le singole occorrenze: la «serie madre» è un
    // modello senza data propria, e non è una lezione.
    if (e.type === "seriesMaster") continue;

    const chiave = e.iCalUId ?? e.id;
    const inizio = istanteUtc(e.start);
    if (!chiave || !inizio) continue;

    // Il link passa dallo stesso controllo di una lezione scritta a mano: in
    // pagina diventa un pulsante che gli studenti premono fidandosi di noi, e
    // non cambia niente che la fonte sia Microsoft invece di un copia e incolla.
    const urlDiretta = urlDirettaValido(e.onlineMeeting?.joinUrl);
    if (!urlDiretta) continue;

    const fine = istanteUtc(e.end);
    const minuti = fine ? Math.round((fine.getTime() - inizio.getTime()) / 60_000) : null;

    riunioni.push({
      chiave,
      titolo: (e.subject ?? "").trim() || "Riunione senza titolo",
      inizio,
      durataMinuti: minuti && minuti > 0 && minuti <= 600 ? minuti : null,
      urlDiretta,
    });
  }

  return riunioni.sort((x, y) => x.inizio.getTime() - y.inizio.getTime());
}

/**
 * Come la lezione si presenta nel modulo, prima che il docente la tocchi.
 *
 * Due proposte, entrambe modificabili. La materia: «LEZIONE 2 FISICA» dice già
 * di che materia è, e chiederlo a chi ha scritto quel titolo dieci minuti prima
 * è una domanda inutile. Il titolo: diventa «Fisica · Lezione 2», perché finisce
 * in un elenco già diviso per materia, dove venti righe tutte maiuscole si
 * leggono una per una invece che a colpo d'occhio.
 *
 * Se il titolo non ha quella forma si lascia com'è: meglio il titolo di chi
 * l'ha scritto che un'invenzione nostra.
 */
export function proposta(
  titolo: string,
  materie: readonly { name: string; short: string }[]
): { materia: string | null; titolo: string } {
  const t = titolo.toLocaleUpperCase("it-IT");

  // Si guarda anche il nome corto: la materia si chiama «Chimica e propedeutica
  // biochimica», ma nessuno scrive quello nel titolo di una riunione.
  const trovata = materie.find((m) =>
    [m.name, m.short].some((n) => t.includes(n.toLocaleUpperCase("it-IT")))
  );

  const numero = /\bLEZIONE\s*(\d{1,2})\b/i.exec(titolo)?.[1];
  const riscritto =
    trovata && numero
      ? `${trovata.short} · Lezione ${numero}`
      : trovata
        ? trovata.short
        : titolo.trim();

  return { materia: trovata?.name ?? null, titolo: riscritto };
}
