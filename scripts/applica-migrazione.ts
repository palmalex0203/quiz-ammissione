/**
 * Applica un file migration.sql al database e registra la migrazione.
 *
 * Su questa macchina `npx prisma migrate deploy` non parte: il motore di schema
 * esce subito con "spawn UNKNOWN". Qui si fa a mano quello che farebbe lui —
 * eseguire le istruzioni del file e scrivere la riga in `_prisma_migrations`,
 * senza la quale Prisma considererebbe la migrazione ancora da applicare e
 * proverebbe a rifarla al primo deploy che riesce.
 *
 * Idempotente: se la migrazione risulta già registrata, non fa niente.
 *
 * Uso: npx tsx scripts/applica-migrazione.ts prisma/migrations/<cartella>
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma";

async function main() {
  const cartella = process.argv[2]?.replace(/[\\/]+$/, "");
  if (!cartella) {
    console.error("Uso: npx tsx scripts/applica-migrazione.ts prisma/migrations/<cartella>");
    process.exit(1);
  }
  const nome = basename(cartella);
  const file = join(cartella, "migration.sql");
  const sql = readFileSync(file, "utf-8");

  const gia = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM "_prisma_migrations"
    WHERE migration_name = ${nome} AND finished_at IS NOT NULL`;
  if (Number(gia[0]?.n ?? 0) > 0) {
    console.log(`"${nome}" risulta già applicata. Non faccio niente.`);
    return;
  }

  // Le istruzioni si eseguono una per volta: $executeRawUnsafe non accetta più
  // comandi in una sola chiamata. I commenti "--" restano attaccati alla loro
  // istruzione e non danno fastidio.
  const istruzioni = sql
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^(--[^\n]*\s*)+$/.test(s));

  for (const [i, istruzione] of istruzioni.entries()) {
    const prima = istruzione.split("\n").find((r) => !r.trim().startsWith("--")) ?? "";
    console.log(`  ${i + 1}/${istruzioni.length}  ${prima.trim().slice(0, 70)}`);
    await prisma.$executeRawUnsafe(istruzione);
  }

  const checksum = createHash("sha256").update(sql).digest("hex");
  await prisma.$executeRaw`
    INSERT INTO "_prisma_migrations"
      (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
    VALUES (${randomUUID()}, ${checksum}, NOW(), ${nome}, NULL, NULL, NOW(), ${istruzioni.length})`;

  console.log(`\n"${nome}" applicata e registrata.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
