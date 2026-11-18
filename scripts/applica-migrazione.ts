/**
 * Applica un file migration.sql al database, e lo registra come fatto.
 *
 * Prende il posto di `apply-migration.ts`, che era scritto per Turso e dal
 * passaggio a Neon non funziona più: usava il client libsql su un URL che oggi
 * è `postgresql://`.
 *
 * Perché non `prisma migrate deploy`: sul computer di chi lavora a questo
 * progetto Node non è installato, quindi quel comando non si può lanciare da
 * lì. Questo script fa le stesse due cose che farebbe lui — esegue l'SQL e
 * scrive la riga in `_prisma_migrations` — passando dalla connessione che il
 * sito usa già.
 *
 * L'impronta è lo sha256 del file **con i ritorni a capo in stile Unix**: è la
 * forma che Prisma confronta, verificata su una migrazione già applicata. Con i
 * ritorni a capo di Windows verrebbe un valore diverso e `migrate status`
 * segnalerebbe una migrazione modificata.
 *
 * Una migrazione già registrata non viene riapplicata: lo script se ne accorge
 * e si ferma, così rilanciarlo per sbaglio non rompe niente.
 *
 * Uso:
 *   npx tsx scripts/applica-migrazione.ts prisma/migrations/<cartella>/migration.sql
 *   ... --prova     mostra che cosa farebbe senza toccare il database
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import { prisma } from "../src/lib/prisma";

async function main() {
  const prova = process.argv.includes("--prova");
  const percorso = process.argv.slice(2).find((a) => !a.startsWith("--"));
  if (!percorso) throw new Error("Indicare il file: scripts/applica-migrazione.ts <migration.sql>");

  const nome = basename(dirname(percorso));
  const testo = readFileSync(percorso, "utf8");
  const impronta = createHash("sha256").update(testo.replace(/\r\n/g, "\n")).digest("hex");

  console.log(`migrazione: ${nome}`);
  console.log(`impronta:   ${impronta}`);

  const gia = await prisma.$queryRaw<{ migration_name: string }[]>`
    SELECT migration_name FROM "_prisma_migrations" WHERE migration_name = ${nome}
  `;
  if (gia.length > 0) {
    console.log("già registrata: non faccio niente.");
    return;
  }

  // I comandi si eseguono uno per uno: $executeRawUnsafe non accetta più
  // istruzioni in una volta sola.
  const comandi = testo
    .split("\n")
    .filter((r) => !r.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean);

  console.log(`comandi da eseguire: ${comandi.length}`);
  for (const c of comandi) console.log(`  ${c.replace(/\s+/g, " ").slice(0, 100)}`);

  if (prova) {
    console.log("\n(prova: niente è stato scritto)");
    return;
  }

  for (const c of comandi) await prisma.$executeRawUnsafe(c);

  await prisma.$executeRaw`
    INSERT INTO "_prisma_migrations"
      (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
    VALUES
      (gen_random_uuid()::text, ${impronta}, now(), ${nome}, NULL, NULL, now(), ${comandi.length})
  `;

  console.log("\napplicata e registrata.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err instanceof Error ? err.message : err);
    await prisma.$disconnect();
    process.exit(1);
  });
