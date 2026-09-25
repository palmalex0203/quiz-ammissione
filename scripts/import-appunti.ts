/**
 * Carica nel database gli appunti scritti come file markdown in content/appunti/.
 *
 * Ogni file ha in testa un blocco con codice argomento, percorso, materia e titolo.
 * Gli appunti entrano sempre come **bozza**: diventano visibili agli studenti solo
 * quando l'insegnante li pubblica dalla sua area, dopo averli riletti.
 *
 * La sezione finale "Da verificare prima di pubblicare" viene staccata dal corpo e
 * messa da parte: serve all'insegnante durante la rilettura, non allo studente, che
 * non deve trovarsela in fondo all'appunto.
 *
 * Reimportare lo stesso file ne aggiorna il testo senza toccare lo stato di
 * pubblicazione, così una correzione al file non ripubblica per sbaglio né
 * nasconde un appunto già approvato.
 *
 * Uso:
 *   npx tsx scripts/import-appunti.ts                  (tutti i file)
 *   npx tsx scripts/import-appunti.ts content/appunti/professioni-sanitarie/B7.md
 */
import "dotenv/config";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/prisma";
import { isKnownTopic, topicLabel } from "../src/lib/topics";
import { isTrackId } from "../src/lib/tracks";

const RADICE = "content/appunti";

// Titolo che separa l'appunto vero e proprio dalle note per chi lo rilegge.
const SEPARATORE = /\n#{1,3}\s*Da verificare[^\n]*\n/i;

function separaRevisione(corpo: string): { testo: string; revisione: string | null } {
  const punto = corpo.search(SEPARATORE);
  if (punto === -1) return { testo: corpo, revisione: null };
  const match = SEPARATORE.exec(corpo)!;
  return {
    // Via anche l'eventuale riga di trattini che precede la sezione.
    testo: corpo
      .slice(0, punto)
      .replace(/\n-{3,}\s*$/, "")
      .trim(),
    revisione: corpo.slice(punto + match[0].length).trim(),
  };
}

type Testata = { codice: string; percorso: string; materia: string; titolo: string };

// Blocco iniziale fra due righe di trattini: chiave e valore, uno per riga.
function leggiTestata(contenuto: string, file: string): { testata: Testata; corpo: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(contenuto);
  if (!match) throw new Error(`${file}: manca il blocco iniziale fra --- e ---`);

  const campi: Record<string, string> = {};
  for (const riga of match[1].split(/\r?\n/)) {
    const punto = riga.indexOf(":");
    // Le righe indentate appartengono a un elenco (es. le fonti): non servono qui.
    if (punto === -1 || /^\s/.test(riga)) continue;
    campi[riga.slice(0, punto).trim()] = riga
      .slice(punto + 1)
      .trim()
      .replace(/^"|"$/g, "");
  }

  for (const chiave of ["codice", "percorso", "materia", "titolo"]) {
    if (!campi[chiave]) throw new Error(`${file}: manca "${chiave}" nel blocco iniziale`);
  }
  return {
    testata: { codice: campi.codice, percorso: campi.percorso, materia: campi.materia, titolo: campi.titolo },
    corpo: match[2].trim(),
  };
}

function elencaFile(percorso: string): string[] {
  if (statSync(percorso).isFile()) return [percorso];
  return readdirSync(percorso).flatMap((nome) => {
    const completo = join(percorso, nome);
    if (statSync(completo).isDirectory()) return elencaFile(completo);
    return nome.endsWith(".md") ? [completo] : [];
  });
}

async function main() {
  const percorsi = process.argv.slice(2);
  const file = (percorsi.length > 0 ? percorsi : [RADICE]).flatMap(elencaFile);
  if (file.length === 0) {
    console.log("Nessun file .md trovato.");
    return;
  }

  for (const f of file) {
    const { testata, corpo } = leggiTestata(readFileSync(f, "utf-8"), f);

    if (!isKnownTopic(testata.codice)) {
      throw new Error(`${f}: argomento sconosciuto "${testata.codice}" (vedi src/lib/topics.ts)`);
    }
    if (!isTrackId(testata.percorso)) {
      throw new Error(`${f}: percorso sconosciuto "${testata.percorso}"`);
    }

    const { testo, revisione } = separaRevisione(corpo);

    const esistente = await prisma.topicNote.findUnique({ where: { topic: testata.codice } });
    await prisma.topicNote.upsert({
      where: { topic: testata.codice },
      create: {
        topic: testata.codice,
        track: testata.percorso,
        subject: testata.materia,
        title: testata.titolo,
        body: testo,
        reviewNotes: revisione,
        isPublished: false,
      },
      // Lo stato di pubblicazione non si tocca: è una decisione dell'insegnante.
      update: {
        track: testata.percorso,
        subject: testata.materia,
        title: testata.titolo,
        body: testo,
        reviewNotes: revisione,
      },
    });

    const parole = testo.split(/\s+/).length;
    const stato = esistente ? (esistente.isPublished ? "aggiornato, resta pubblicato" : "aggiornato, resta bozza") : "nuovo, come bozza";
    console.log(
      `${testata.codice} — ${topicLabel(testata.codice) ?? testata.titolo}: ${parole} parole (${stato})` +
        (revisione ? " · note di revisione separate" : "")
    );
  }

  const [totali, pubblicati] = await Promise.all([
    prisma.topicNote.count(),
    prisma.topicNote.count({ where: { isPublished: true } }),
  ]);
  console.log(`\nAppunti nel database: ${totali}, di cui pubblicati ${pubblicati}.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err instanceof Error ? err.message : err);
    await prisma.$disconnect();
    process.exit(1);
  });
