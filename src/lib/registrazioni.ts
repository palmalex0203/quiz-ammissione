import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TRACK_IDS } from "@/lib/tracks";
import { FUSO, LEZIONI_TAG, fineLezione, lezioniPubblicate, urlDirettaValido } from "@/lib/lezioni";

/*
 * Dalla diretta alla registrazione, da solo.
 *
 * Le riunioni delle lezioni le crea un unico account della scuola. Finita la
 * lezione, il sito chiede a Microsoft se la registrazione c'è; quando c'è, crea
 * un link al file e lo mette nella scheda della lezione.
 *
 * Dove finisce il video dipende dal tipo di riunione, e non è una sottigliezza:
 * una riunione normale lo salva nelle registrazioni del OneDrive
 * dell'organizzatore, una riunione di canale nella raccolta documenti del sito
 * SharePoint del team. Si cercano entrambi i posti (vedi `trovaFile`).
 *
 * Il link si chiede prima per chiunque, perché non tutti gli studenti hanno un
 * account Microsoft; se il sito ha la condivisione esterna disattivata si
 * ricade sul link per l'organizzazione, che l'accesso lo chiede.
 *
 * Chi chiede: non un orologio (Vercel Hobby fa girare i cron una volta al
 * giorno), ma la pagina stessa. Uno studente — o il docente — apre una lezione
 * finita e ancora senza registrazione, e la pagina avvisa il server, che
 * controlla. La domanda a Microsoft passa da una cache di pochi minuti, quindi
 * trenta studenti sulla stessa pagina fanno una domanda sola. E il database si
 * tocca solo quando c'è davvero qualcosa da scrivere.
 *
 * Cosa serve su Microsoft (una volta sola, vedi DEPLOY.md):
 *   - un'app registrata in Entra con i permessi applicativi
 *     OnlineMeetings.Read.All, OnlineMeetingRecording.Read.All, Files.ReadWrite.All;
 *   - un "application access policy" di Teams concesso all'organizzatore;
 *   - per i link aperti a chiunque, la condivisione esterna consentita nel
 *     centro di amministrazione SharePoint, sul tenant e sul singolo sito.
 *     Senza, il link resta per i soli account della scuola.
 *
 * Variabili d'ambiente: MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET e
 * MS_ORGANIZZATORE_ID (l'ID oggetto dell'account che crea le riunioni). In più,
 * MS_RACCOLTA_LEZIONI: la raccolta documenti del team dove si tengono le
 * lezioni. Non è obbligatoria — senza, si cerca comunque — ma con quella il
 * video si trova subito invece di aspettare la ricerca di Microsoft.
 */

const GRAPH = "https://graph.microsoft.com/v1.0";

/** Quanto si aspetta fra una domanda a Microsoft e la successiva, per lezione. */
const OGNI_CINQUE_MINUTI = 5 * 60;

/** Oltre questo, una lezione senza registrazione non la si cerca più. */
const GIORNI_DI_RICERCA = 7;

type Configurazione = {
  tenant: string;
  client: string;
  segreto: string;
  organizzatore: string;
  /** La raccolta documenti del team dove si tengono le lezioni, se c'è. */
  raccolta: string | null;
};

function configurazione(): Configurazione | null {
  const tenant = process.env.MS_TENANT_ID;
  const client = process.env.MS_CLIENT_ID;
  const segreto = process.env.MS_CLIENT_SECRET;
  const organizzatore = process.env.MS_ORGANIZZATORE_ID;
  if (!tenant || !client || !segreto || !organizzatore) return null;
  return { tenant, client, segreto, organizzatore, raccolta: process.env.MS_RACCOLTA_LEZIONI ?? null };
}

export function registrazioniAttive(): boolean {
  return configurazione() !== null;
}

// Il gettone dura un'ora: lo si tiene finché la funzione resta viva.
let gettone: { valore: string; scade: number } | null = null;

async function gettoneGraph(c: Configurazione): Promise<string> {
  if (gettone && gettone.scade > Date.now() + 60_000) return gettone.valore;

  const r = await fetch(`https://login.microsoftonline.com/${c.tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: c.client,
      client_secret: c.segreto,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Accesso a Microsoft rifiutato (${r.status}): ${await r.text()}`);

  const j = (await r.json()) as { access_token: string; expires_in: number };
  gettone = { valore: j.access_token, scade: Date.now() + j.expires_in * 1000 };
  return gettone.valore;
}

async function graph<T>(c: Configurazione, percorso: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${GRAPH}${percorso}`, {
    ...init,
    headers: {
      authorization: `Bearer ${await gettoneGraph(c)}`,
      "content-type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Graph ${percorso} → ${r.status}: ${await r.text()}`);
  return (await r.json()) as T;
}

type Riunione = { id: string; subject: string | null };
type Registrazione = { id: string; createdDateTime: string; endDateTime?: string | null };
type FileDrive = {
  id: string;
  name: string;
  createdDateTime: string;
  file?: { mimeType?: string };
  /** In quale raccolta sta il file: il OneDrive dell'organizzatore o un sito. */
  parentReference?: { driveId?: string };
};

/**
 * La riunione a partire dal link incollato nella lezione.
 *
 * Il link nuovo di Teams (teams.microsoft.com/meet/<numero>?p=…) porta in
 * chiaro l'ID di partecipazione, e per quello Graph sa filtrare. Il link
 * vecchio (…/l/meetup-join/…) si cerca invece per indirizzo intero.
 */
async function trovaRiunione(c: Configurazione, urlDiretta: string): Promise<Riunione | null> {
  const utente = encodeURIComponent(c.organizzatore);
  const numero = /\/meet\/(\d{6,})/.exec(urlDiretta)?.[1];

  const filtro = numero
    ? `joinMeetingIdSettings/joinMeetingId eq '${numero}'`
    : `JoinWebUrl eq '${urlDiretta.replace(/'/g, "''")}'`;

  const r = await graph<{ value: Riunione[] }>(
    c,
    `/users/${utente}/onlineMeetings?$filter=${encodeURIComponent(filtro)}`
  );
  return r.value[0] ?? null;
}

/** Il giorno di un istante come lo scrive Teams nel nome del file: 20261112. */
function giornoCompatto(istante: Date, fuso: string): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(istante);
  return p.replace(/-/g, "");
}

/**
 * I file che Teams potrebbe aver salvato quel giorno, cercati in tutto il
 * tenant.
 *
 * Serve perché una riunione di canale non finisce nel OneDrive di nessuno: va
 * nella raccolta documenti del sito SharePoint del team. Lì non si può entrare
 * a tentativi — il sito non lo sappiamo — ma la ricerca di Microsoft lo trova,
 * perché Teams scrive la data e l'ora nel nome del file.
 *
 * La ricerca con permessi applicativi vuole la regione: il tenant della scuola
 * è europeo. Se un giorno non lo fosse, qui tornerebbe un errore e si
 * ricadrebbe sul OneDrive, come prima.
 */
async function cercaFileNelTenant(c: Configurazione, inizioRegistrazione: Date): Promise<FileDrive[]> {
  // Nel nome a volte c'è l'ora locale, a volte quella UTC con il suffisso
  // "UTC": intorno a mezzanotte sono due giorni diversi, quindi si cercano
  // entrambi.
  const giorni = [...new Set([giornoCompatto(inizioRegistrazione, FUSO), giornoCompatto(inizioRegistrazione, "UTC")])];
  const trovati: FileDrive[] = [];

  for (const giorno of giorni) {
    try {
      const r = await graph<{
        value: { hitsContainers?: { hits?: { resource?: FileDrive }[] }[] }[];
      }>(c, "/search/query", {
        method: "POST",
        body: JSON.stringify({
          requests: [
            {
              entityTypes: ["driveItem"],
              query: { queryString: giorno },
              region: "EUR",
              from: 0,
              size: 25,
            },
          ],
        }),
      });

      for (const hit of r.value[0]?.hitsContainers?.[0]?.hits ?? []) {
        if (hit.resource?.id) trovati.push(hit.resource);
      }
    } catch {
      // Ricerca non disponibile: restano i file del OneDrive.
    }
  }

  return trovati;
}

/** I file nelle cartelle delle registrazioni del OneDrive dell'organizzatore. */
async function cercaNelOneDrive(c: Configurazione): Promise<FileDrive[]> {
  const utente = encodeURIComponent(c.organizzatore);
  const trovati: FileDrive[] = [];

  // La cartella si chiama "Recordings"; in alcuni account in italiano
  // "Registrazioni". Si guardano tutte e due.
  for (const cartella of ["Recordings", "Registrazioni"]) {
    try {
      const r = await graph<{ value: FileDrive[] }>(
        c,
        `/users/${utente}/drive/root:/${cartella}:/children?$top=200&$select=id,name,createdDateTime,file,parentReference`
      );
      trovati.push(...r.value);
    } catch {
      // Cartella assente: si prova l'altra.
    }
  }

  return trovati;
}

/**
 * Le registrazioni nella raccolta documenti del team delle lezioni.
 *
 * È il posto dove finiscono per davvero: le lezioni si tengono nel canale di un
 * team, e la registrazione di una riunione di canale va nella raccolta del
 * team, non nel OneDrive di chi la organizza. Il primo livello della raccolta
 * sono i canali; dentro ognuno Teams crea la cartella delle registrazioni la
 * prima volta che si registra qualcosa.
 *
 * Si leggono le cartelle una per una invece di usare la ricerca perché l'elenco
 * di una cartella è immediato, mentre la ricerca aspetta che Microsoft abbia
 * indicizzato il file: a lezione appena finita è proprio quello che manca.
 */
async function cercaNelTeam(c: Configurazione): Promise<FileDrive[]> {
  if (!c.raccolta) return [];

  const raccolta = `/drives/${encodeURIComponent(c.raccolta)}`;
  const trovati: FileDrive[] = [];

  let canali: FileDrive[] = [];
  try {
    canali = (await graph<{ value: FileDrive[] }>(c, `${raccolta}/root/children?$top=100&$select=id,name`)).value;
  } catch {
    return [];
  }

  for (const canale of canali) {
    for (const cartella of ["Recordings", "Registrazioni"]) {
      try {
        const r = await graph<{ value: FileDrive[] }>(
          c,
          `${raccolta}/root:/${encodeURIComponent(canale.name)}/${cartella}:/children` +
            `?$top=200&$select=id,name,createdDateTime,file,parentReference`
        );
        trovati.push(...r.value);
      } catch {
        // Quel canale non ha registrazioni: si passa al prossimo.
      }
    }
  }

  return trovati;
}

/**
 * Il file della registrazione, dovunque Teams l'abbia messo.
 *
 * Graph dice che la registrazione c'è e quando è cominciata, ma non dice in
 * quale file sta, e il posto dipende dal tipo di riunione. Si guardano tre
 * posti, dal più probabile al più disperato, e si smette appena si trova:
 * la raccolta del team (le lezioni si tengono lì), il OneDrive
 * dell'organizzatore (una riunione fuori dal team), la ricerca su tutto il 365.
 *
 * In ogni caso il file si riconosce dall'istante: nasce quando parte la
 * registrazione, quindi si prende l'mp4 creato più vicino a quel momento, e se
 * c'è anche il titolo della riunione nel nome tanto meglio.
 */
async function trovaFile(
  c: Configurazione,
  inizioRegistrazione: Date,
  titolo: string | null
): Promise<FileDrive | null> {
  const mezzOra = 30 * 60_000;
  const vicino = (f: FileDrive) =>
    !!f.file &&
    /\.mp4$/i.test(f.name) &&
    Math.abs(new Date(f.createdDateTime).getTime() - inizioRegistrazione.getTime()) <= mezzOra;

  const candidati: FileDrive[] = [];
  for (const dove of [
    () => cercaNelTeam(c),
    () => cercaNelOneDrive(c),
    () => cercaFileNelTenant(c, inizioRegistrazione),
  ]) {
    candidati.push(...(await dove()));
    if (candidati.some(vicino)) break;
  }

  const video = candidati
    .filter((f) => f.file && /\.mp4$/i.test(f.name))
    .map((f) => ({ f, distanza: Math.abs(new Date(f.createdDateTime).getTime() - inizioRegistrazione.getTime()) }))
    .filter((v) => v.distanza <= mezzOra);

  if (video.length === 0) return null;

  const conTitolo = titolo
    ? video.filter((v) => v.f.name.toLowerCase().startsWith(titolo.toLowerCase().slice(0, 20)))
    : [];
  const scelta = (conTitolo.length > 0 ? conTitolo : video).sort((a, b) => a.distanza - b.distanza)[0];
  return scelta.f;
}

/**
 * Il link pubblico alla registrazione di una lezione, se è pronta. Null se non
 * c'è ancora.
 *
 * Lo stesso link Teams può servire per più lezioni (una "sala" che si riusa):
 * per questo si prende solo la registrazione cominciata intorno all'orario di
 * questa lezione, non una qualsiasi della riunione.
 */
export async function cercaRegistrazione(urlDiretta: string, inizio: Date, fine: Date): Promise<string | null> {
  const c = configurazione();
  if (!c) return null;

  const riunione = await trovaRiunione(c, urlDiretta);
  if (!riunione) return null;

  const utente = encodeURIComponent(c.organizzatore);
  const { value: registrazioni } = await graph<{ value: Registrazione[] }>(
    c,
    `/users/${utente}/onlineMeetings/${encodeURIComponent(riunione.id)}/recordings`
  );

  // Margine largo prima (si entra in anticipo, e qualche lezione può essere
  // stata salvata con l'orario spostato di un'ora) e dopo (si sfora).
  const da = inizio.getTime() - 2 * 60 * 60_000;
  const a = fine.getTime() + 60 * 60_000;
  const diQuesta = registrazioni
    .filter((r) => {
      const t = new Date(r.createdDateTime).getTime();
      return t >= da && t <= a;
    })
    .sort((x, y) => new Date(x.createdDateTime).getTime() - new Date(y.createdDateTime).getTime());

  // Finché la registrazione non ha una fine, il file non è completo.
  const pronta = diQuesta.find((r) => r.endDateTime);
  if (!pronta) return null;

  const file = await trovaFile(c, new Date(pronta.createdDateTime), riunione.subject);
  if (!file) return null;

  // Il file può stare nel OneDrive dell'organizzatore o nel sito di un team:
  // si chiede il link alla raccolta che lo contiene, non a quella dove si
  // sperava che fosse.
  const dove = file.parentReference?.driveId
    ? `/drives/${encodeURIComponent(file.parentReference.driveId)}`
    : `/users/${utente}/drive`;

  // Si chiede prima il link per chiunque: gli studenti non hanno tutti un
  // account Microsoft, e quello si apre e basta. Se la condivisione esterna è
  // disattivata sul sito — su molti tenant scolastici lo è — si ricade sul link
  // per l'organizzazione, che chiede di entrare con l'account della scuola. Un
  // pulsante che chiede l'accesso è comunque meglio di nessun pulsante.
  const chiediLink = async (scope: "anonymous" | "organization") =>
    graph<{ link?: { webUrl?: string } }>(c, `${dove}/items/${encodeURIComponent(file.id)}/createLink`, {
      method: "POST",
      body: JSON.stringify({ type: "view", scope }),
    });

  let link: { link?: { webUrl?: string } };
  try {
    link = await chiediLink("anonymous");
  } catch {
    link = await chiediLink("organization");
  }

  return urlRegistrazioneValido(link.link?.webUrl ?? null);
}

/**
 * Il link a una registrazione, se punta a OneDrive/SharePoint. Come per la
 * diretta, un elenco chiuso: diventa un pulsante che gli studenti premono
 * fidandosi di noi.
 */
export function urlRegistrazioneValido(url: string | null | undefined): string | null {
  if (!url) return null;
  let indirizzo: URL;
  try {
    indirizzo = new URL(url.trim());
  } catch {
    return null;
  }
  if (indirizzo.protocol !== "https:") return null;
  const host = indirizzo.hostname.toLowerCase();
  const ammesso = ["sharepoint.com", "onedrive.live.com", "1drv.ms"].some(
    (sede) => host === sede || host.endsWith(`.${sede}`)
  );
  return ammesso ? indirizzo.toString() : null;
}

/**
 * La domanda a Microsoft, una volta ogni cinque minuti per lezione al massimo.
 * Anche il "non ancora" resta in cache: è proprio quello che si vuole non
 * richiedere a ogni apertura di pagina.
 */
const cercaConCalma = unstable_cache(
  async (_id: string, urlDiretta: string, inizioIso: string, fineIso: string) => {
    try {
      return await cercaRegistrazione(urlDiretta, new Date(inizioIso), new Date(fineIso));
    } catch (e) {
      console.error("[registrazioni]", e);
      return null;
    }
  },
  ["registrazione-lezione"],
  { revalidate: OGNI_CINQUE_MINUTI }
);

/** Una lezione finita, in diretta, che aspetta ancora la sua registrazione. */
export function aspettaRegistrazione(
  l: { urlDiretta: string | null; urlRegistrazione: string | null; data: string | Date; durataMinuti: number | null },
  adesso = Date.now()
): boolean {
  if (!urlDirettaValido(l.urlDiretta) || l.urlRegistrazione) return false;
  const fine = fineLezione(l).getTime();
  return fine <= adesso && adesso - fine < GIORNI_DI_RICERCA * 24 * 60 * 60_000;
}

/**
 * Controlla le lezioni finite senza registrazione e salva quelle pronte.
 *
 * Restituisce gli id delle lezioni che una registrazione ce l'hanno — quelle
 * trovate adesso più quelle già note — così chi aspetta capisce se ricaricare.
 * Le lezioni si leggono dalla cache: una chiamata che non trova niente non
 * accende il database.
 */
export async function aggiornaRegistrazioni(): Promise<string[]> {
  const tutte = (await Promise.all(TRACK_IDS.map((t) => lezioniPubblicate(t)))).flat();
  const pronte = tutte.filter((l) => l.urlRegistrazione).map((l) => l.id);
  if (!registrazioniAttive()) return pronte;

  const trovate: string[] = [];
  for (const l of tutte.filter((x) => aspettaRegistrazione(x))) {
    const url = await cercaConCalma(l.id, l.urlDiretta!, l.data, fineLezione(l).toISOString());
    if (!url) continue;

    await prisma.lezione.update({ where: { id: l.id }, data: { urlRegistrazione: url } });
    trovate.push(l.id);
  }

  // Subito, non "alla prossima": chi ha la pagina aperta ricarica adesso e
  // deve trovare il pulsante, non la versione vecchia della cache.
  if (trovate.length > 0) revalidateTag(LEZIONI_TAG, { expire: 0 });
  return [...pronte, ...trovate];
}
