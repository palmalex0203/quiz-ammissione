// Ripara le domande di "Comprensione del testo" che, all'interno dello stesso gruppo
// di lettura, facevano riferimento a un brano incluso solo nella prima domanda del
// gruppo (order=1) e non ripetuto nelle successive. Estrae il brano dalla prima
// domanda (rimuovendo la frase finale con il quesito specifico) e lo antepone alle
// domande indicate come "orfane".
//
// Uso: npx tsx scripts/fix-orphaned-passages.ts
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const FIX_GROUPS: { testTitle: string; targetOrders: number[] }[] = [
  { testTitle: "Simulazione 1", targetOrders: [2] },
  { testTitle: "Simulazione 2", targetOrders: [2, 3, 4] },
  { testTitle: "Simulazione 3", targetOrders: [2, 3, 4] },
  { testTitle: "Simulazione 4", targetOrders: [2, 3, 4] },
  { testTitle: "Simulazione Estiva 1", targetOrders: [2, 3] },
  { testTitle: "Simulazione Estiva 2", targetOrders: [2, 3] },
  { testTitle: "Simulazione Estiva 3", targetOrders: [2, 3] },
  { testTitle: "Simulazione Estiva 4", targetOrders: [2, 3] },
  { testTitle: "Simulazione Estiva 5", targetOrders: [2, 3] },
];

function extractPassage(fullText: string): string | null {
  const parts = fullText.split(/\n\n+/);
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1].trim();
  if (!last.endsWith("?") && !last.endsWith(":")) return null;
  return parts.slice(0, -1).join("\n\n");
}

async function main() {
  let totalFixed = 0;
  for (const group of FIX_GROUPS) {
    const test = await prisma.test.findFirst({ where: { title: group.testTitle } });
    if (!test) {
      console.log(`ATTENZIONE: test non trovato: ${group.testTitle}`);
      continue;
    }
    const questions = await prisma.question.findMany({
      where: { testId: test.id, subject: "Comprensione del testo" },
      orderBy: { order: "asc" },
    });
    const first = questions.find((q) => q.order === 1);
    if (!first) {
      console.log(`ATTENZIONE: nessuna domanda order=1 in ${group.testTitle}`);
      continue;
    }
    const passage = extractPassage(first.text);
    if (!passage) {
      console.log(`ATTENZIONE: impossibile estrarre il brano da ${group.testTitle} (order 1)`);
      continue;
    }
    for (const targetOrder of group.targetOrders) {
      const target = questions.find((q) => q.order === targetOrder);
      if (!target) {
        console.log(`ATTENZIONE: order=${targetOrder} non trovato in ${group.testTitle}`);
        continue;
      }
      if (target.text.length > 300) {
        console.log(`SALTATO (già lungo, ${target.text.length} car.): ${group.testTitle} order=${targetOrder}`);
        continue;
      }
      const newText = `${passage}\n\n${target.text}`;
      await prisma.question.update({ where: { id: target.id }, data: { text: newText } });
      console.log(`Corretto: ${group.testTitle} order=${targetOrder} (${target.text.length} -> ${newText.length} car.)`);
      totalFixed++;
    }
  }
  console.log(`\nTotale domande corrette: ${totalFixed}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
