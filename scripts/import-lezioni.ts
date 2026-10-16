/**
 * Carica le lezioni registrate da un file JSON.
 *
 * Il filmato non si carica da nessuna parte: sta già su YouTube o Vimeo, e qui
 * si incolla il suo indirizzo. Lo script ne ricava fornitore e identificativo,
 * e nel database finiscono quelli — non l'indirizzo intero — così la pagina può
 * costruire il lettore da sé senza fidarsi di quello che è stato scritto.
 *
 * Formato del file, un oggetto per lezione:
 *
 *   [
 *     {
 *       "titolo": "La cellula: membrana e trasporti",
 *       "descrizione": "Prima lezione del modulo di biologia.",   // facoltativa
 *       "percorso": "SEMESTRE_FILTRO",
 *       "materia": "Biologia",                                     // facoltativa
 *       "argomento": "SF-BIO-05",                                  // facoltativo
 *       "data": "2026-10-27",
 *       "durataMinuti": 120,                                       // facoltativa
 *       "video": "https://www.youtube.com/watch?v=XXXXXXXXXXX"
 *     }
 *   ]
 *
 * Per una lezione **in diretta** si mette `diretta` al posto di `video`, con
 * l'indirizzo della riunione (Teams, Meet o Zoom):
 *
 *   { ..., "diretta": "https://teams.microsoft.com/meet/..." }
 *
 * In quel caso la pagina non incorpora niente — Teams non si lascia mettere
 * in un iframe — e mostra un pulsante che apre la riunione.
 *
 * Una lezione già caricata si riconosce dal video: ricaricare lo stesso file ne
 * aggiorna i dati senza toccare lo stato di pubblicazione, così una correzione
 * non ripubblica per sbaglio né nasconde una lezione già approvata.
 *
 * Come per gli appunti, le lezioni entrano come **bozza**: gli studenti le
 * vedono solo quando l'insegnante le pubblica.
 *
 * Uso: npx tsx scripts/import-lezioni.ts <file.json> [--pubblica]
 *
 * Senza `--pubblica` la lezione entra come bozza e non la vede nessuno, che è
 * il comportamento giusto quando si carica una registrazione da riguardare
 * prima. Con `--pubblica` compare subito agli studenti del percorso: serve per
 * una diretta, dove la scheda deve esserci prima che la lezione cominci.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";
import { isTrackId, TRACKS, TRACK_IDS } from "../src/lib/tracks";
import { isKnownTopic, topicLabel } from "../src/lib/topics";
import { leggiVideo, urlDirettaValido } from "../src/lib/lezioni";

type Voce = {
  titolo?: string;
  descrizione?: string;
  percorso?: string;
  materia?: string;
  argomento?: string;
  data?: string;
  durataMinuti?: number;
  /** Lezione registrata: l'indirizzo del filmato su YouTube o Vimeo. */
  video?: string;
  /** Lezione in diretta: l'indirizzo della riunione. In alternativa a `video`. */
  diretta?: string;
};

async function main() {
  const argomenti = process.argv.slice(2).filter((a) => a !== "--pubblica");
  const pubblica = process.argv.includes("--pubblica");
  const file = argomenti[0];
  if (!file) {
    console.error("Uso: npx tsx scripts/import-lezioni.ts <file.json> [--pubblica]");
    process.exit(1);
  }

  const voci: Voce[] = JSON.parse(readFileSync(file, "utf-8"));
  if (!Array.isArray(voci) || voci.length === 0) throw new Error(`${file}: nessuna lezione nel file.`);

  for (const [i, v] of voci.entries()) {
    const dove = `lezione ${i + 1}`;

    if (!v.titolo?.trim()) throw new Error(`${dove}: manca il titolo.`);
    if (!isTrackId(v.percorso)) {
      throw new Error(`${dove}: percorso "${v.percorso}" sconosciuto. Valori ammessi: ${TRACK_IDS.join(", ")}`);
    }
    // O registrata o in diretta, non tutte e due: una scheda che è entrambe
    // le cose non si sa come mostrarla, e qui conviene accorgersene adesso.
    if (v.video?.trim() && v.diretta?.trim()) {
      throw new Error(`${dove}: ha sia "video" sia "diretta". Scegline uno.`);
    }
    if (!v.video?.trim() && !v.diretta?.trim()) {
      throw new Error(`${dove}: manca "video" (registrata) o "diretta" (riunione).`);
    }

    const video = v.video?.trim() ? leggiVideo(v.video) : null;
    if (v.video?.trim() && !video) {
      throw new Error(`${dove}: non riconosco "${v.video}". Serve un indirizzo di YouTube o di Vimeo.`);
    }

    const diretta = v.diretta?.trim() ? urlDirettaValido(v.diretta) : null;
    if (v.diretta?.trim() && !diretta) {
      throw new Error(
        `${dove}: "${v.diretta}" non è un indirizzo di riunione che accettiamo (Teams, Meet, Zoom, in https).`
      );
    }

    const data = v.data ? new Date(v.data) : null;
    if (!data || Number.isNaN(data.getTime())) throw new Error(`${dove}: data mancante o illeggibile.`);

    if (v.materia && !TRACKS[v.percorso].subjects.some((m) => m.name === v.materia)) {
      throw new Error(`${dove}: materia "${v.materia}" non prevista da ${TRACKS[v.percorso].label}.`);
    }
    if (v.argomento && !isKnownTopic(v.argomento)) {
      throw new Error(`${dove}: argomento sconosciuto "${v.argomento}".`);
    }

    const dati = {
      titolo: v.titolo.trim(),
      descrizione: v.descrizione?.trim() || null,
      track: v.percorso,
      subject: v.materia ?? null,
      topic: v.argomento ?? null,
      data,
      durataMinuti: v.durataMinuti ?? null,
      fornitore: video?.fornitore ?? null,
      videoId: video?.videoId ?? null,
      urlDiretta: diretta,
    };

    // Una registrata si riconosce dal filmato, una diretta dal titolo e dalla
    // data: due riunioni diverse possono avere lo stesso indirizzo (una sala
    // che si riusa), quindi l'indirizzo non la identifica.
    const esistente = await prisma.lezione.findFirst({
      where: video
        ? { fornitore: video.fornitore, videoId: video.videoId }
        : { titolo: dati.titolo, track: dati.track },
      select: { id: true, isPublished: true },
    });

    // `--pubblica` pubblica; senza, lo stato di pubblicazione non si tocca —
    // così correggere un titolo non nasconde una lezione già approvata, né
    // ne pubblica una che l'insegnante non ha ancora riguardato.
    const statoPubblicazione = pubblica ? { isPublished: true } : {};

    if (esistente) {
      await prisma.lezione.update({
        where: { id: esistente.id },
        data: { ...dati, ...statoPubblicazione },
      });
    } else {
      await prisma.lezione.create({ data: { ...dati, ...statoPubblicazione } });
    }

    const argomento = v.argomento ? ` · ${topicLabel(v.argomento) ?? v.argomento}` : "";
    const stato = pubblica
      ? esistente
        ? "aggiornata e pubblicata"
        : "nuova e pubblicata"
      : esistente
        ? esistente.isPublished
          ? "aggiornata, resta pubblicata"
          : "aggiornata, resta bozza"
        : "nuova, come bozza";
    console.log(`${dati.titolo}${argomento} (${stato})`);
  }

  const [totali, pubblicate] = await Promise.all([
    prisma.lezione.count(),
    prisma.lezione.count({ where: { isPublished: true } }),
  ]);
  console.log(`\nLezioni nel database: ${totali}, di cui pubblicate ${pubblicate}.`);

  await svuotaCache();
}

/**
 * Avvisa il sito che le lezioni sono cambiate. Senza, una lezione pubblicata
 * può metterci fino a un'ora a comparire — e sembra un guasto.
 */
async function svuotaCache() {
  const sito = process.env.SITO_URL;
  const token = process.env.APPUNTI_REVALIDA_TOKEN;
  if (!sito || !token) {
    console.log("\nCache non svuotata: mancano SITO_URL o APPUNTI_REVALIDA_TOKEN.");
    return;
  }

  try {
    const r = await fetch(`${sito.replace(/\/$/, "")}/api/appunti/revalida`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
    console.log(r.ok ? "Cache svuotata: le modifiche sono già visibili." : `Cache non svuotata: il sito ha risposto ${r.status}.`);
  } catch {
    console.log("Cache non svuotata: il sito non ha risposto.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e instanceof Error ? e.message : e);
    await prisma.$disconnect();
    process.exit(1);
  });
