/**
 * Aggiunge domande a un'esercitazione che esiste già, senza rifarla.
 *
 * `import-test.ts` crea sempre un test nuovo: va bene la prima volta, non per
 * ampliarne uno. Rifarlo vorrebbe dire cancellare le domande vecchie e con esse
 * le risposte già date — di un tentativo consegnato resterebbe il punteggio ma
 * non la correzione domanda per domanda.
 *
 * Qui le domande esistenti non si toccano: le nuove si accodano in fondo,
 * continuando la numerazione. L'esercitazione si trova dal codice della
 * dispensa, lo stesso campo `topic` che lega la dispensa alla sua esercitazione.
 *
 * Una domanda già presente, riconosciuta dal testo, viene saltata: rilanciare lo
 * script per sbaglio non crea doppioni.
 *
 * Uso:
 *   npx tsx scripts/aggiungi-domande.ts <file.json> <CODICE-DISPENSA>
 *   ... --prova     dice che cosa farebbe senza scrivere niente
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";

type Opzione = { text: string; isCorrect: boolean };
type Domanda = {
  subject: string;
  topic?: string;
  type?: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "COMPLETAMENTO";
  text: string;
  spiegazione?: string;
  options: Opzione[];
};

async function main() {
  const prova = process.argv.includes("--prova");
  const [file, codice] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!file || !codice) throw new Error("Uso: aggiungi-domande.ts <file.json> <CODICE-DISPENSA>");

  const nuove: Domanda[] = JSON.parse(readFileSync(file, "utf8"));

  // Gli stessi controlli dell'importatore: una domanda scritta male va fermata
  // qui, non scoperta da uno studente.
  for (const q of nuove) {
    const corrette = q.options.filter((o) => o.isCorrect).length;
    if (q.type === "COMPLETAMENTO") {
      if (q.options.length === 0) throw new Error(`Completamento senza risposte: ${q.text.slice(0, 60)}`);
      if (corrette !== q.options.length) throw new Error(`Completamento con una risposta non corretta: ${q.text.slice(0, 60)}`);
    } else {
      if (q.options.length < 2) throw new Error(`Meno di 2 alternative: ${q.text.slice(0, 60)}`);
      if (corrette !== 1) throw new Error(`${corrette} risposte corrette (attesa 1): ${q.text.slice(0, 60)}`);
    }
  }

  const test = await prisma.test.findFirst({
    where: { kind: "ESERCITAZIONE", questions: { some: { topic: codice } } },
    select: { id: true, title: true, _count: { select: { questions: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (!test) throw new Error(`Nessuna esercitazione collegata a ${codice}.`);

  const esistenti = await prisma.question.findMany({
    where: { testId: test.id },
    select: { text: true, order: true },
  });
  const testi = new Set(esistenti.map((q) => q.text));
  let ordine = Math.max(0, ...esistenti.map((q) => q.order));

  console.log(`«${test.title}»: ${test._count.questions} domande, ne aggiungo ${nuove.length}`);

  let aggiunte = 0;
  for (const q of nuove) {
    if (testi.has(q.text)) {
      console.log(`  già presente, salto: ${q.text.slice(0, 60)}…`);
      continue;
    }
    ordine++;
    if (!prova) {
      await prisma.question.create({
        data: {
          testId: test.id,
          type: q.type ?? "MULTIPLE_CHOICE",
          subject: q.subject,
          topic: q.topic ?? codice,
          text: q.text,
          spiegazione: q.spiegazione ?? null,
          order: ordine,
          options: { create: q.options.map((o, j) => ({ text: o.text, isCorrect: o.isCorrect, order: j + 1 })) },
        },
      });
    }
    aggiunte++;
  }

  const totale = prova ? test._count.questions : await prisma.question.count({ where: { testId: test.id } });
  console.log(`${prova ? "Aggiungerebbe" : "Aggiunte"}: ${aggiunte}. Domande in tutto: ${totale}${prova ? " (prova)" : ""}.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err);
  await prisma.$disconnect();
  process.exit(1);
});
