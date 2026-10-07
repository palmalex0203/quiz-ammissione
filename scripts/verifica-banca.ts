/**
 * Misura se le domande a scelta multipla si possono indovinare senza saperle.
 *
 * Tre indizi tradiscono una domanda scritta male, e si vedono tutti contando i
 * caratteri invece di leggere:
 *
 *  1. la risposta giusta è la più lunga — chi non sa la materia sceglie quella;
 *  2. la risposta giusta è molto più lunga della media dei distrattori, cioè è
 *     una spiegazione mentre le altre sono etichette;
 *  3. la risposta giusta sta sempre nella stessa posizione.
 *
 * Il metro non è un'opinione: sono i fascicoli veri del Ministero, che stanno in
 * content/semestre-filtro/prove-ufficiali/. Lì la risposta giusta è la più lunga
 * nel 37% dei casi (con cinque alternative il caso puro darebbe il 20%) e misura
 * 34 caratteri contro i 30 dei distrattori. È quello il bersaglio.
 *
 * Uso:  npx tsx scripts/verifica-banca.ts content/semestre-filtro/banca/*.json
 *       ... --peggiori 15     elenca le domande più sbilanciate
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";

type Opzione = { text: string; isCorrect: boolean };
type Domanda = { type?: string; text: string; options: Opzione[] };

const argv = process.argv.slice(2);
const iPeggiori = argv.indexOf("--peggiori");
const QUANTI = iPeggiori !== -1 ? Number(argv[iPeggiori + 1]) || 10 : 0;
const FILE = argv.filter((a, i) => !a.startsWith("--") && !(iPeggiori !== -1 && i === iPeggiori + 1));

// Soglie prese dai fascicoli veri, con un margine: oltre queste la domanda si
// indovina a occhio.
const QUOTA_PIU_LUNGA = 0.45;
const RAPPORTO_MAX = 1.35;

type Riga = { file: string; testo: string; giusta: number; media: number; rapporto: number };

function main() {
  if (FILE.length === 0) {
    console.error("Uso: npx tsx scripts/verifica-banca.ts <file.json> [...] [--peggiori N]");
    process.exit(1);
  }

  const sbilanciate: Riga[] = [];
  let mc = 0;
  let piuLunga = 0;
  let sommaGiusta = 0;
  let sommaDistrattori = 0;
  let nDistrattori = 0;
  const posizioni = [0, 0, 0, 0, 0];

  for (const percorso of FILE) {
    const domande: Domanda[] = JSON.parse(readFileSync(percorso, "utf-8"));
    const nome = basename(percorso);
    let mcFile = 0;
    let lungheFile = 0;

    for (const q of domande) {
      if (q.type === "COMPLETAMENTO") continue;
      mc++;
      mcFile++;

      const lunghezze = q.options.map((o) => o.text.trim().length);
      const i = q.options.findIndex((o) => o.isCorrect);
      if (i === -1) continue;
      if (i < 5) posizioni[i]++;

      const giusta = lunghezze[i];
      const altre = lunghezze.filter((_, j) => j !== i);
      const media = altre.reduce((s, n) => s + n, 0) / (altre.length || 1);

      if (giusta === Math.max(...lunghezze)) {
        piuLunga++;
        lungheFile++;
      }
      sommaGiusta += giusta;
      sommaDistrattori += altre.reduce((s, n) => s + n, 0);
      nDistrattori += altre.length;

      const rapporto = giusta / (media || 1);
      if (rapporto > RAPPORTO_MAX) {
        sbilanciate.push({ file: nome, testo: q.text, giusta, media: Math.round(media), rapporto });
      }
    }

    if (mcFile > 0) {
      console.log(
        `${nome.padEnd(34)} ${String(mcFile).padStart(3)} MC — la giusta è la più lunga ${String(
          Math.round((lungheFile * 100) / mcFile)
        ).padStart(3)}%`
      );
    }
  }

  const quota = piuLunga / (mc || 1);
  const mediaGiusta = sommaGiusta / (mc || 1);
  const mediaAltre = sommaDistrattori / (nDistrattori || 1);
  const rapporto = mediaGiusta / (mediaAltre || 1);
  const tot = posizioni.reduce((s, n) => s + n, 0) || 1;

  console.log(`\n${mc} domande a scelta multipla`);
  console.log(
    `la giusta è la più lunga: ${Math.round(quota * 100)}%  (bersaglio ≤ ${Math.round(QUOTA_PIU_LUNGA * 100)}%, i fascicoli veri 37%)`
  );
  console.log(
    `lunghezza media: ${Math.round(mediaGiusta)} contro ${Math.round(mediaAltre)} caratteri — rapporto ${rapporto.toFixed(2)}  (bersaglio ≤ ${RAPPORTO_MAX}, i fascicoli veri 1,13)`
  );
  console.log(
    `posizione nel file: ${posizioni.map((n, i) => `${String.fromCharCode(65 + i)} ${Math.round((n * 100) / tot)}%`).join("  ")}  (nel database vengono mescolate all'importazione)`
  );
  console.log(`domande oltre il rapporto ${RAPPORTO_MAX}: ${sbilanciate.length}`);

  if (QUANTI > 0) {
    console.log(`\nLe ${Math.min(QUANTI, sbilanciate.length)} più sbilanciate:`);
    for (const r of sbilanciate.sort((a, b) => b.rapporto - a.rapporto).slice(0, QUANTI)) {
      console.log(`  ${r.rapporto.toFixed(1)}×  ${r.giusta} contro ${r.media}  ${r.file}`);
      console.log(`        ${r.testo.slice(0, 90)}`);
    }
  }

  const passa = quota <= QUOTA_PIU_LUNGA && rapporto <= RAPPORTO_MAX;
  console.log(passa ? "\nVa bene." : "\nDa sistemare.");
  process.exit(passa ? 0 : 1);
}

main();
