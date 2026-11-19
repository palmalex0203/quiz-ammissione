// Importa un test da un file JSON nel database (locale o di produzione, a seconda
// delle variabili d'ambiente caricate quando si esegue lo script).
//
// Formato JSON atteso: un array di domande
// [{ subject: string, text: string, options: [{ text: string, isCorrect: boolean }] }, ...]
//
// Uso: npx tsx scripts/import-test.ts <percorso-questions.json> "<Titolo del test>" ["<descrizione>"] ["<kind>"] ["<folder>"] ["<track>"]
// kind: SIMULAZIONE (default) o ESERCITAZIONE. folder: etichetta di raggruppamento (es. "Chimica").
// track: PROFESSIONI_SANITARIE (default) o SEMESTRE_FILTRO. Senza, un test del semestre
// filtro finirebbe nell'altro percorso e i suoi studenti non lo vedrebbero.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";
import { isTrackId } from "../src/lib/tracks";

type ImportedOption = { text: string; isCorrect: boolean };
type ImportedQuestion = {
  subject: string;
  text: string;
  type?: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "COMPLETAMENTO";
  /**
   * L'argomento a cui la domanda appartiene. Per le esercitazioni ricavate da
   * una dispensa è il codice intero della dispensa (SF-BIO-01-L01), che è anche
   * il legame con cui la pagina dell'appunto ritrova la sua esercitazione.
   * Non sporca i conteggi della banca dati: quelli guardano solo il test POOL
   * (vedi src/lib/question-pool.ts).
   */
  topic?: string;
  /** Perche la risposta giusta e giusta: si mostra solo nella correzione. */
  spiegazione?: string;
  options: ImportedOption[];
};

async function main() {
  const [jsonPath, title, description, kind, folder, track] = process.argv.slice(2);
  if (track && !isTrackId(track)) throw new Error(`Percorso sconosciuto: ${track}`);
  if (!jsonPath || !title) {
    console.error('Uso: npx tsx scripts/import-test.ts <percorso-questions.json> "<Titolo del test>" ["<descrizione>"]');
    process.exit(1);
  }

  const questions: ImportedQuestion[] = JSON.parse(readFileSync(jsonPath, "utf-8"));

  for (const q of questions) {
    const dove = q.text.slice(0, 60);
    const corrette = q.options.filter((o) => o.isCorrect).length;

    if (q.type === "COMPLETAMENTO") {
      // Qui lo studente scrive: in `options` non ci sono alternative fra cui
      // scegliere ma le forme di risposta che si accettano — «3,2» e «3.2»,
      // «kelvin» e «K» — tutte corrette, la prima è quella mostrata nella
      // correzione. Una sola riga va benissimo.
      if (q.options.length === 0) throw new Error(`Domanda a completamento senza risposte accettate: ${dove}`);
      if (corrette !== q.options.length) {
        throw new Error(`Domanda a completamento con una risposta non corretta: ${dove}`);
      }
      continue;
    }

    if (q.options.length < 2) throw new Error(`Domanda con meno di 2 opzioni: ${dove}`);
    if (corrette !== 1) {
      throw new Error(`Domanda con ${corrette} risposte corrette (attesa 1): ${dove}`);
    }
  }

  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  if (!teacher) throw new Error("Nessun account insegnante trovato nel database.");

  const test = await prisma.test.create({
    data: {
      title,
      description: description ?? null,
      createdById: teacher.id,
      isPublished: true,
      kind: kind ?? "SIMULAZIONE",
      folder: folder || null,
      ...(track ? { track } : {}),
      questions: {
        create: questions.map((q, i) => ({
          type: q.type ?? "MULTIPLE_CHOICE",
          subject: q.subject,
          topic: q.topic ?? null,
          spiegazione: q.spiegazione ?? null,
          text: q.text,
          order: i + 1,
          options: {
            create: q.options.map((o, j) => ({ text: o.text, isCorrect: o.isCorrect, order: j + 1 })),
          },
        })),
      },
    },
  });

  console.log(`Test creato: "${test.title}" (${questions.length} domande) — id ${test.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
