/**
 * Attacca alle domande già importate la spiegazione scritta nel file.
 *
 * Reimportare l'esercitazione non andrebbe bene: `import-test.ts` crea un test
 * nuovo, e le domande già fatte dagli studenti resterebbero attaccate a quello
 * vecchio. Qui invece le domande restano dove sono e cambia solo un campo: gli
 * id non si muovono, i tentativi già consegnati continuano a mostrare la
 * correzione giusta.
 *
 * Le domande si appaiano per **testo**, non per posizione: è l'unica chiave che
 * non cambia se un giorno l'ordine del file venisse toccato. Se un testo non si
 * ritrova, la domanda viene saltata e segnalata, invece di attaccare la
 * spiegazione sbagliata a quella accanto.
 *
 * Uso:
 *   npx tsx scripts/applica-spiegazioni.ts content/semestre-filtro/esercitazioni/*.json
 *   ... --prova     dice che cosa farebbe senza scrivere niente
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { prisma } from "../src/lib/prisma";

type Domanda = { topic?: string; text: string; spiegazione?: string };

async function main() {
  const prova = process.argv.includes("--prova");
  const file = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (file.length === 0) throw new Error("Indicare almeno un file di esercitazione.");

  let scritte = 0;
  let saltate = 0;

  for (const percorso of file) {
    const domande: Domanda[] = JSON.parse(readFileSync(percorso, "utf8"));
    const conSpiegazione = domande.filter((d) => d.spiegazione?.trim());
    const codice = domande[0]?.topic;
    if (!codice) {
      console.log(`${basename(percorso)}: nessun argomento indicato, salto il file.`);
      continue;
    }

    const inArchivio = await prisma.question.findMany({
      where: { topic: codice, test: { kind: "ESERCITAZIONE" } },
      select: { id: true, text: true, spiegazione: true },
    });

    console.log(`\n${basename(percorso)} — ${codice}`);
    console.log(`  nel file: ${domande.length} domande, ${conSpiegazione.length} con spiegazione`);
    console.log(`  in archivio: ${inArchivio.length} domande`);

    for (const d of conSpiegazione) {
      const q = inArchivio.find((x) => x.text === d.text);
      if (!q) {
        console.log(`  NON TROVATA: ${d.text.slice(0, 70)}…`);
        saltate++;
        continue;
      }
      if (q.spiegazione === d.spiegazione!.trim()) continue;
      if (!prova) {
        await prisma.question.update({
          where: { id: q.id },
          data: { spiegazione: d.spiegazione!.trim() },
        });
      }
      scritte++;
    }

    const ora = await prisma.question.count({
      where: { topic: codice, test: { kind: "ESERCITAZIONE" }, spiegazione: { not: null } },
    });
    console.log(`  con spiegazione dopo: ${prova ? "(prova, niente scritto)" : ora}`);
  }

  console.log(`\n${prova ? "Avrebbe scritto" : "Scritte"}: ${scritte} spiegazioni. Saltate: ${saltate}.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err instanceof Error ? err.message : err);
  await prisma.$disconnect();
  process.exit(1);
});
