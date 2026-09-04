/**
 * Elimina le simulazioni generate che lo studente ha aperto ma mai consegnato.
 *
 * Ogni test generato salva una copia di 60 domande e 300 opzioni: le prove
 * abbandonate riempiono il database senza contenere alcun risultato utile.
 *
 * Criteri (volutamente prudenti — vengono eliminati solo test che non contengono
 * alcun dato di valore):
 *   - kind = 'GENERATA'   → mai simulazioni ufficiali, esercitazioni o banche dati
 *   - nessun tentativo consegnato (SUBMITTED) → nessun punteggio da perdere
 *   - ultimo accesso più vecchio della soglia → non tocca chi sta svolgendo ora
 *
 * Uso:
 *   npx tsx scripts/prune-abandoned-tests.ts            → prova, non cancella nulla
 *   npx tsx scripts/prune-abandoned-tests.ts --apply    → esegue l'eliminazione
 *   npx tsx scripts/prune-abandoned-tests.ts --apply --days 7
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const apply = process.argv.includes("--apply");
const daysArg = process.argv.indexOf("--days");
const DAYS = daysArg !== -1 ? Number(process.argv[daysArg + 1]) : 2;

async function main() {
  if (!Number.isFinite(DAYS) || DAYS < 1) throw new Error("--days deve essere un numero >= 1");
  const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

  const candidates = await prisma.test.findMany({
    where: {
      kind: "GENERATA",
      attempts: { none: { status: "SUBMITTED" } },
      createdAt: { lt: cutoff },
    },
    select: {
      id: true,
      createdAt: true,
      _count: { select: { questions: true } },
      attempts: { select: { startedAt: true, status: true } },
    },
  });

  // Esclude comunque i test con un tentativo aperto di recente: se lo studente ha
  // ripreso la prova ieri, il test non è abbandonato anche se creato tempo fa.
  const abandoned = candidates.filter((t) =>
    t.attempts.every((a) => a.startedAt < cutoff)
  );

  const questions = abandoned.reduce((sum, t) => sum + t._count.questions, 0);
  console.log(`Soglia: nessuna attività da più di ${DAYS} giorni (prima del ${cutoff.toLocaleString("it-IT")})`);
  console.log(`Test generati abbandonati: ${abandoned.length}`);
  console.log(`Domande che verrebbero liberate: ${questions} (circa ${questions * 5} opzioni)`);

  const protectedCount = await prisma.test.count({
    where: { kind: "GENERATA", attempts: { some: { status: "SUBMITTED" } } },
  });
  console.log(`Test generati CON risultati, non toccati: ${protectedCount}`);

  if (!apply) {
    console.log("\n(prova: non è stato cancellato nulla — rilancia con --apply per eseguire)");
    return;
  }

  let done = 0;
  for (let i = 0; i < abandoned.length; i += 25) {
    const slice = abandoned.slice(i, i + 25);
    await prisma.test.deleteMany({ where: { id: { in: slice.map((t) => t.id) } } });
    done += slice.length;
    console.log(`  eliminati ${done}/${abandoned.length}`);
  }
  console.log(`\nFatto: ${done} test generati abbandonati eliminati.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
