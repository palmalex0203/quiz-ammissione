/**
 * Rimescola l'ordine delle alternative nelle domande a scelta multipla della
 * banca dati.
 *
 * Nei file sorgente la risposta giusta è scritta per prima, perché così il file
 * si rilegge e si corregge; l'importatore le mescolava però non le mescolava, e
 * nel database sono finite in quell'ordine: nella banca del semestre filtro la
 * risposta giusta era la A nel 99% delle domande. Da ottobre 2026
 * scripts/import-pool.ts mescola da solo; questo script sistema quello che era
 * già stato caricato.
 *
 * Tocca solo i test POOL e solo le domande a scelta multipla: i fascicoli
 * ufficiali conservano l'ordine del Ministero, e nelle domande a completamento
 * la prima risposta accettata è quella mostrata nella correzione.
 *
 * I tentativi già svolti non ne risentono: una risposta registrata punta all'id
 * dell'alternativa, non alla sua posizione.
 *
 * Uso:  npx tsx scripts/mescola-opzioni.ts            solo conta, non scrive
 *       npx tsx scripts/mescola-opzioni.ts --scrivi
 *       ... --percorso PROFESSIONI_SANITARIE          (di norma non serve)
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { randomShuffle } from "../src/lib/shuffle";

const SCRIVI = process.argv.includes("--scrivi");
// Senza indicazioni si sistema solo il semestre filtro, l'unica banca sbilanciata.
const i = process.argv.indexOf("--percorso");
const PERCORSO = i !== -1 ? process.argv[i + 1] : "SEMESTRE_FILTRO";

function distribuzione(posizioni: number[]): string {
  const conta = [0, 0, 0, 0, 0, 0];
  for (const p of posizioni) conta[Math.min(p, 5)]++;
  const tot = posizioni.length || 1;
  return conta
    .slice(0, 5)
    .map((n, i) => `${String.fromCharCode(65 + i)} ${Math.round((n * 100) / tot)}%`)
    .join("  ");
}

async function main() {
  const pool = await prisma.test.findMany({
    where: { kind: "POOL", track: PERCORSO },
    select: { id: true, title: true },
  });
  console.log(`Banche dati di ${PERCORSO}: ${pool.length}`);

  const prima: number[] = [];
  const dopo: number[] = [];
  let mescolate = 0;

  for (const test of pool) {
    const domande = await prisma.question.findMany({
      where: { testId: test.id, type: "MULTIPLE_CHOICE" },
      select: { id: true, options: { select: { id: true, isCorrect: true }, orderBy: { order: "asc" } } },
    });

    for (const d of domande) {
      prima.push(d.options.findIndex((o) => o.isCorrect));
      const nuovo = randomShuffle(d.options);
      dopo.push(nuovo.findIndex((o) => o.isCorrect));
      if (!SCRIVI) continue;
      await prisma.$transaction(
        nuovo.map((o, i) => prisma.answerOption.update({ where: { id: o.id }, data: { order: i + 1 } }))
      );
      mescolate++;
    }
    console.log(`  ${test.title}: ${domande.length} domande a scelta multipla`);
  }

  console.log(`\nPosizione della risposta giusta, prima: ${distribuzione(prima)}`);
  console.log(`Posizione della risposta giusta, dopo:  ${distribuzione(dopo)}`);
  console.log(
    SCRIVI ? `\nMescolate ${mescolate} domande.` : "\nProva a vuoto: niente è stato scritto. Rilancia con --scrivi."
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
