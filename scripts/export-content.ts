/**
 * Esporta i CONTENUTI della piattaforma (banche dati, simulazioni, esercitazioni)
 * in un unico file JSON, per ricostruirli su un altro database.
 *
 * Esporta solo ciò che è riutilizzabile: test, domande e opzioni. Restano fuori
 * account, tentativi e risultati, che sono legati agli studenti di un database
 * specifico e non avrebbero senso altrove.
 *
 * Legge con il client libsql, così funziona sia sul file SQLite locale sia su
 * Turso, indipendentemente dal dialetto che parla il client dell'applicazione.
 *
 * Uso:
 *   npx tsx scripts/export-content.ts --out backup/contenuti.json
 *   npx tsx scripts/export-content.ts --env .env.production.local --out backup/prod.json
 */
import { createClient } from "@libsql/client";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : fallback;
};
const OUT = arg("--out", "backup/contenuti.json");
const ENV_FILE = arg("--env", ".env");

// Le simulazioni generate sono copie usa e getta create per un singolo studente:
// si rigenerano da sole dalla banca dati e non vanno portate dietro.
const KINDS = ["POOL", "SIMULAZIONE", "ESERCITAZIONE"];

function readEnv(file: string): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
        .map((l) => {
          const i = l.indexOf("=");
          return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
        })
    );
  } catch {
    return {};
  }
}

async function main() {
  const env = readEnv(ENV_FILE);
  const client = createClient({
    url: env.DATABASE_URL ?? "file:prisma/dev.db",
    authToken: env.TURSO_AUTH_TOKEN,
  });

  const lista = KINDS.map((k) => `'${k}'`).join(",");
  const tests = (
    await client.execute(
      `SELECT id, title, description, kind, folder, "isPublished", "shuffleQuestions",
              "timeLimitMinutes", "maxAttempts"
       FROM "Test" WHERE kind IN (${lista}) ORDER BY kind, title`
    )
  ).rows as unknown as Record<string, unknown>[];

  const esportati = [];
  let totDomande = 0;
  let totOpzioni = 0;

  for (const t of tests) {
    const domande = (
      await client.execute({
        sql: `SELECT id, type, subject, topic, text, "order", points
              FROM "Question" WHERE "testId" = ? ORDER BY "order"`,
        args: [t.id as string],
      })
    ).rows as unknown as Record<string, unknown>[];

    const conOpzioni = [];
    for (const q of domande) {
      const opzioni = (
        await client.execute({
          sql: `SELECT text, "isCorrect", "order" FROM "AnswerOption"
                WHERE "questionId" = ? ORDER BY "order"`,
          args: [q.id as string],
        })
      ).rows as unknown as Record<string, unknown>[];

      conOpzioni.push({
        type: q.type,
        subject: q.subject,
        topic: q.topic,
        text: q.text,
        order: Number(q.order),
        points: Number(q.points),
        options: opzioni.map((o) => ({
          text: o.text,
          isCorrect: Boolean(o.isCorrect),
          order: Number(o.order),
        })),
      });
      totOpzioni += opzioni.length;
    }

    totDomande += conOpzioni.length;
    esportati.push({
      title: t.title,
      description: t.description,
      kind: t.kind,
      folder: t.folder,
      isPublished: Boolean(t.isPublished),
      shuffleQuestions: Boolean(t.shuffleQuestions),
      timeLimitMinutes: t.timeLimitMinutes === null ? null : Number(t.timeLimitMinutes),
      maxAttempts: t.maxAttempts === null ? null : Number(t.maxAttempts),
      questions: conOpzioni,
    });
    console.log(`  ${String(conOpzioni.length).padStart(5)} domande  [${t.kind}] ${t.title}`);
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify({ esportatoIl: new Date().toISOString(), tests: esportati }), "utf8");

  console.log(`\nEsportati ${esportati.length} test, ${totDomande} domande, ${totOpzioni} opzioni`);
  console.log(`File: ${OUT}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
