// Imposta il limite di tempo a 100 minuti su tutte le simulazioni (kind = SIMULAZIONE o GENERATA).
// Le esercitazioni (kind = ESERCITAZIONE) e la banca dati interna (kind = POOL) non vengono toccate.
//
// Uso: npx tsx scripts/set-time-limit.ts
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await prisma.test.updateMany({
    where: { kind: { in: ["SIMULAZIONE", "GENERATA"] } },
    data: { timeLimitMinutes: 100 },
  });
  console.log(`Aggiornati ${result.count} test a 100 minuti.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
