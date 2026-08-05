// Prisma "migrate deploy" non supporta gli URL libsql:// (limite noto di Prisma 7 con Turso).
// Questo script applica manualmente un file migration.sql al database Turso/libsql
// usando il client libsql, che invece funziona regolarmente su libsql://.
//
// Uso: npx tsx scripts/apply-migration.ts prisma/migrations/<cartella>/migration.sql
import "dotenv/config";
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";

const migrationPath = process.argv[2];
if (!migrationPath) {
  console.error("Uso: npx tsx scripts/apply-migration.ts <percorso-migration.sql>");
  process.exit(1);
}

const sql = readFileSync(migrationPath, "utf-8");

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  await client.executeMultiple(sql);
  console.log(`Migrazione applicata: ${migrationPath}`);
}

main()
  .then(() => client.close())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
