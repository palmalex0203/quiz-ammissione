// Imposta kind/folder sui test già esistenti in base al pattern del titolo.
// "Esercitazione {Materia} - {Codice}: {Argomento}" -> kind=ESERCITAZIONE, folder={Materia}
// Tutto il resto resta kind=SIMULAZIONE (default), folder=null.
//
// Uso: npx tsx scripts/backfill-test-kind.ts
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const tests = await prisma.test.findMany({ select: { id: true, title: true } });
  const re = /^Esercitazione (.+?) - [A-Z]\d+:/;
  let updated = 0;
  for (const t of tests) {
    const m = re.exec(t.title);
    if (m) {
      await prisma.test.update({
        where: { id: t.id },
        data: { kind: "ESERCITAZIONE", folder: m[1] },
      });
      updated++;
    }
  }
  console.log(`Aggiornati ${updated} test su ${tests.length} totali.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
