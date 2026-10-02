// Carica un fascicolo d'esame ufficiale come prova svolgibile dagli studenti.
//
// A differenza di import-pool.ts, che riempie la banca dati del generatore, qui si
// crea un test fisso e pubblicato: le 31 domande sono quelle del fascicolo, nello
// stesso ordine, e lo studente le affronta con il tempo vero dell'esame. L'anagrafica
// della prova (appello, data, fascicolo PDF) sta in src/lib/prove-ufficiali.ts: lo
// slug passato qui deve corrispondere a una voce di quell'elenco.
//
// Formato JSON atteso: lo stesso di import-pool.ts
//   [{ subject, topic?, type?, text, options: [{text, isCorrect}] }, ...]
//
// Uso: npx tsx scripts/import-prova-ufficiale.ts <percorso-questions.json> <slug>
import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";
import { isKnownTopic } from "../src/lib/topics";
import { COMPLETION_MAX_LENGTH } from "../src/lib/completion";
import { KIND_UFFICIALE, PROVE_UFFICIALI, etichettaAppello } from "../src/lib/prove-ufficiali";
import { TRACKS } from "../src/lib/tracks";

type ImportedOption = { text: string; isCorrect: boolean };
type ImportedQuestion = {
  subject: string;
  topic?: string | null;
  type?: "MULTIPLE_CHOICE" | "COMPLETAMENTO";
  text: string;
  options: ImportedOption[];
};

async function main() {
  const [jsonPath, slug] = process.argv.slice(2);
  if (!jsonPath || !slug) {
    console.error("Uso: npx tsx scripts/import-prova-ufficiale.ts <percorso-questions.json> <slug>");
    console.error(`Slug disponibili: ${PROVE_UFFICIALI.map((p) => p.slug).join(", ")}`);
    process.exit(1);
  }

  const prova = PROVE_UFFICIALI.find((p) => p.slug === slug);
  if (!prova) {
    console.error(`Slug sconosciuto "${slug}". Aggiungilo prima a src/lib/prove-ufficiali.ts.`);
    process.exit(1);
  }

  const questions: ImportedQuestion[] = JSON.parse(readFileSync(jsonPath, "utf-8"));

  if (questions.length !== prova.questions) {
    throw new Error(
      `La prova ${prova.slug} dovrebbe avere ${prova.questions} domande, il file ne ha ${questions.length}.`
    );
  }

  for (const q of questions) {
    if (q.subject !== prova.subject) {
      throw new Error(`Materia "${q.subject}" diversa da quella della prova ("${prova.subject}").`);
    }
    if (q.topic && !isKnownTopic(q.topic)) {
      throw new Error(`Argomento sconosciuto "${q.topic}": ${q.text.slice(0, 60)}`);
    }
    if (q.type === "COMPLETAMENTO") {
      const ammesse = q.options.filter((o) => o.isCorrect);
      if (ammesse.length === 0) {
        throw new Error(`Domanda a completamento senza risposte accettate: ${q.text.slice(0, 60)}`);
      }
      const troppoLunga = ammesse.find((o) => o.text.trim().length > COMPLETION_MAX_LENGTH);
      if (troppoLunga) {
        throw new Error(
          `Risposta accettata di ${troppoLunga.text.trim().length} caratteri (massimo ${COMPLETION_MAX_LENGTH}): "${troppoLunga.text}"`
        );
      }
    } else {
      if (q.options.length < 2) throw new Error(`Domanda con meno di 2 opzioni: ${q.text.slice(0, 60)}`);
      const corrette = q.options.filter((o) => o.isCorrect).length;
      if (corrette !== 1) {
        throw new Error(`Domanda con ${corrette} risposte corrette (attesa 1): ${q.text.slice(0, 60)}`);
      }
    }
  }

  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  if (!teacher) throw new Error("Nessun account insegnante trovato nel database.");

  // Ricaricare lo stesso fascicolo lo sostituisce: i tentativi già svolti su quella
  // prova spariscono con lui, quindi si ricarica solo per correggere una chiave.
  const esistente = await prisma.test.findFirst({
    where: { title: prova.title, kind: KIND_UFFICIALE, track: prova.track },
  });
  if (esistente) {
    const tentativi = await prisma.attempt.count({ where: { testId: esistente.id } });
    await prisma.test.delete({ where: { id: esistente.id } });
    console.log(
      `Prova precedente "${prova.title}" rimossa` +
        (tentativi > 0 ? ` (con ${tentativi} tentativi già svolti)` : "") +
        ", la ricreo con i nuovi contenuti."
    );
  }

  const test = await prisma.test.create({
    data: {
      title: prova.title,
      description:
        `Fascicolo ufficiale del ${etichettaAppello(prova)}. ` +
        "Il Ministero non pubblica le risposte corrette: quelle usate qui sono state ricavate e attendono la validazione del docente.",
      createdById: teacher.id,
      isPublished: true,
      kind: KIND_UFFICIALE,
      track: prova.track,
      folder: etichettaAppello(prova),
      timeLimitMinutes: prova.minutes,
      shuffleQuestions: false,
      questions: {
        create: questions.map((q, i) => ({
          type: q.type ?? "MULTIPLE_CHOICE",
          subject: q.subject,
          topic: q.topic ?? null,
          text: q.text,
          order: i + 1,
          options: {
            create: q.options.map((o, j) => ({ text: o.text, isCorrect: o.isCorrect, order: j + 1 })),
          },
        })),
      },
    },
  });

  const compl = questions.filter((q) => q.type === "COMPLETAMENTO").length;
  console.log(
    `Prova ufficiale creata per ${TRACKS[prova.track].label}: "${test.title}" — ` +
      `${questions.length} domande (${questions.length - compl} a scelta multipla, ${compl} a completamento), ` +
      `${prova.minutes} minuti — id ${test.id}`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
