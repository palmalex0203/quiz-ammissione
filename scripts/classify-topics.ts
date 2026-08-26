/**
 * Assegna Question.topic (codici B1, C3, ...) a tutte le domande della piattaforma.
 *
 * Procede in tre passaggi, dal più affidabile al meno:
 *  1. Le domande dentro un'esercitazione ereditano l'argomento dal titolo del test,
 *     che l'insegnante ha già scritto nella forma "... - B1: Ciclo cellulare e mitosi".
 *  2. Ogni altra domanda con lo stesso identico testo eredita quell'argomento: la banca
 *     dati e le simulazioni generate contengono copie delle stesse domande.
 *  3. Le restanti vengono lette da una mappa esplicita testo -> argomento
 *     (scripts/topic-map.json), costruita classificando le domande una per una.
 *
 * È idempotente: si può rilanciare senza duplicare nulla.
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/prisma";
import { isKnownTopic } from "../src/lib/topics";

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

async function main() {
  const byText = new Map<string, string>();

  // --- Passaggio 1: dalle esercitazioni ---
  const eserc = await prisma.test.findMany({
    where: { kind: "ESERCITAZIONE" },
    select: { title: true, questions: { select: { text: true } } },
  });
  for (const test of eserc) {
    const code = test.title.match(/-\s*([A-Z]\d+)\s*:/)?.[1];
    if (!code || !isKnownTopic(code)) continue;
    for (const q of test.questions) byText.set(norm(q.text), code);
  }
  console.log(`Argomenti dedotti dalle esercitazioni: ${byText.size} testi`);

  // --- Passaggio 3 (caricato ora, ha la precedenza sui casi non coperti sopra) ---
  const mapPath = join(process.cwd(), "scripts", "topic-map.json");
  if (existsSync(mapPath)) {
    const manual: Record<string, string> = JSON.parse(readFileSync(mapPath, "utf8"));
    let added = 0;
    for (const [text, code] of Object.entries(manual)) {
      if (!isKnownTopic(code)) {
        console.warn(`  ! argomento sconosciuto ignorato: ${code}`);
        continue;
      }
      if (!byText.has(norm(text))) added++;
      byText.set(norm(text), code);
    }
    console.log(`Argomenti dalla mappa manuale: +${added} testi`);
  } else {
    console.log("Nessuna mappa manuale (scripts/topic-map.json) trovata.");
  }

  // --- Passaggio 2: applica a tutte le domande con testo corrispondente ---
  const all = await prisma.question.findMany({ select: { id: true, text: true, topic: true } });
  const updates = new Map<string, string[]>(); // code -> ids
  for (const q of all) {
    const code = byText.get(norm(q.text));
    if (!code || q.topic === code) continue;
    const list = updates.get(code) ?? [];
    list.push(q.id);
    updates.set(code, list);
  }

  let total = 0;
  for (const [code, ids] of updates) {
    // Aggiornamento in blocco per codice: poche query invece di una per domanda.
    for (let i = 0; i < ids.length; i += 200) {
      const slice = ids.slice(i, i + 200);
      await prisma.question.updateMany({ where: { id: { in: slice } }, data: { topic: code } });
    }
    total += ids.length;
  }
  console.log(`\nDomande aggiornate: ${total}`);

  const remaining = await prisma.question.count({ where: { topic: null } });
  const covered = await prisma.question.count({ where: { topic: { not: null } } });
  console.log(`Con argomento: ${covered} | senza argomento: ${remaining}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
