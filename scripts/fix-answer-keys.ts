/**
 * Corregge le soluzioni sbagliate individuate confrontando le copie della stessa domanda.
 *
 * Una stessa domanda (stesso testo e stesso insieme di opzioni) compare in più test:
 * banca dati, simulazioni, test generati per gli studenti. Se le copie non concordano
 * sulla risposta corretta, almeno una è sbagliata. La verifica del 10/09/2026 ha
 * mostrato che in tutti i 48 casi di disaccordo la copia della "Simulazione 3" era
 * giusta e quella della "Simulazione 2" (con le copie da essa derivate) sbagliata:
 * la Simulazione 2 è una versione rimescolata della 3 in cui la soluzione non ha
 * seguito l'opzione corretta.
 *
 * Per ogni domanda in disaccordo lo script prende come riferimento la copia del test
 * indicato, allinea tutte le altre copie (test generati compresi) e, con --regrade,
 * ricalcola i tentativi già consegnati che contengono quelle domande.
 *
 * Senza --apply non modifica nulla e mostra soltanto cosa cambierebbe.
 *
 * Uso:
 *   npx tsx scripts/fix-answer-keys.ts                        prova
 *   npx tsx scripts/fix-answer-keys.ts --apply --regrade      esegue e rivaluta
 *   ... --ref "Simulazione 3"                                  test di riferimento
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { gradeAttempt } from "../src/lib/grading";
import { trackOf } from "../src/lib/tracks";

const APPLY = process.argv.includes("--apply");
const REGRADE = process.argv.includes("--regrade");
const refArg = process.argv.indexOf("--ref");
const REF_TITLE = refArg !== -1 ? process.argv[refArg + 1] : "Simulazione 3";

const norm = (s: string) =>
  s.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ").replace(/[\s:?.]+$/, "").trim();

async function main() {
  const questions = await prisma.question.findMany({
    select: {
      id: true,
      text: true,
      test: { select: { kind: true, title: true } },
      options: { select: { id: true, text: true, isCorrect: true } },
    },
  });

  const groups = new Map<string, typeof questions>();
  for (const q of questions) {
    const key = norm(q.text) + "||" + q.options.map((o) => norm(o.text)).sort().join("|");
    groups.set(key, [...(groups.get(key) ?? []), q]);
  }

  // domanda da correggere -> opzione che deve diventare quella corretta
  const fixes = new Map<string, string>();
  const perKind: Record<string, number> = {};
  const senzaRiferimento: string[] = [];
  const poolDoppie: string[][] = [];
  let gruppiCorretti = 0;

  for (const copies of groups.values()) {
    // Il disaccordo si valuta sui test veri e propri: i test generati sono copie della banca.
    const originals = copies.filter((q) => q.test.kind !== "GENERATA");
    const risposte = new Set(originals.map((q) => norm(q.options.find((o) => o.isCorrect)?.text ?? "")));
    if (originals.length < 2 || risposte.size < 2) continue;

    const refs = originals.filter((q) => q.test.title === REF_TITLE);
    const verita = new Set(refs.map((q) => norm(q.options.find((o) => o.isCorrect)?.text ?? "")));
    if (refs.length === 0 || verita.size !== 1) {
      senzaRiferimento.push(copies[0].text.slice(0, 90));
      continue;
    }
    const giusta = [...verita][0];
    gruppiCorretti++;

    for (const q of copies) {
      const target = q.options.find((o) => norm(o.text) === giusta);
      const attuale = q.options.find((o) => o.isCorrect);
      if (!target) continue;
      if (attuale?.id !== target.id) {
        fixes.set(q.id, target.id);
        perKind[q.test.kind] = (perKind[q.test.kind] ?? 0) + 1;
      }
    }
    const pool = copies.filter((q) => q.test.kind === "POOL");
    if (pool.length > 1) poolDoppie.push(pool.slice(1).map((q) => q.id));
  }

  console.log(`Riferimento: "${REF_TITLE}"`);
  console.log(`Domande in disaccordo corrette: ${gruppiCorretti}`);
  console.log(`Copie da correggere: ${fixes.size}  ${JSON.stringify(perKind)}`);
  if (senzaRiferimento.length) {
    console.log(`Senza una copia di riferimento (da controllare a mano): ${senzaRiferimento.length}`);
    for (const t of senzaRiferimento) console.log(`  - ${t}`);
  }
  const doppie = poolDoppie.flat();
  if (doppie.length) console.log(`Copie doppie nella banca dati da rimuovere dopo la correzione: ${doppie.length}`);

  // Tentativi consegnati che contengono domande corrette: ricalcolo del punteggio.
  const records = await prisma.answerRecord.findMany({
    where: { questionId: { in: [...fixes.keys()] }, attempt: { status: "SUBMITTED" } },
    select: { attemptId: true },
  });
  const attemptIds = [...new Set(records.map((r) => r.attemptId))];
  const regrades: { id: string; student: string; test: string; prima: number; dopo: number; payload: ReturnType<typeof gradeAttempt>; subjects: Map<string, { correct: number; total: number }> }[] = [];

  for (const attemptId of attemptIds) {
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true, score: true, testId: true,
        student: { select: { name: true } }, test: { select: { title: true, track: true } },
        answers: { select: { questionId: true, selectedOptionId: true } },
      },
    });
    if (!attempt) continue;
    const qs = await prisma.question.findMany({
      where: { testId: attempt.testId },
      select: { id: true, subject: true, options: { select: { id: true, isCorrect: true } } },
    });
    // Si valuta con le soluzioni corrette, anche in prova quando il database non è ancora aggiornato.
    const corrected = qs.map((q) => ({
      id: q.id,
      options: q.options.map((o) => ({ id: o.id, isCorrect: fixes.has(q.id) ? o.id === fixes.get(q.id) : o.isCorrect })),
    }));
    // Ogni percorso ha il suo punteggio: si rivaluta con quello del test.
    const payload = gradeAttempt(corrected, attempt.answers, trackOf(attempt.test.track).scoring);
    const subjectOf = new Map(qs.map((q) => [q.id, q.subject]));
    const subjects = new Map<string, { correct: number; total: number }>();
    for (const r of payload.results) {
      const s = subjectOf.get(r.questionId);
      if (!s) continue;
      const st = subjects.get(s) ?? { correct: 0, total: 0 };
      st.total++;
      if (r.isCorrect) st.correct++;
      subjects.set(s, st);
    }
    regrades.push({
      id: attempt.id, student: attempt.student.name, test: attempt.test.title,
      prima: attempt.score ?? 0, dopo: payload.score, payload, subjects,
    });
  }

  const cambiati = regrades.filter((r) => r.prima !== r.dopo);
  console.log(`\nTentativi consegnati che contengono domande corrette: ${regrades.length}, con punteggio che cambia: ${cambiati.length}`);
  for (const r of cambiati) console.log(`  ${r.student.padEnd(24)} ${r.test.slice(0, 40).padEnd(40)} ${r.prima} → ${r.dopo}`);

  if (!APPLY) {
    console.log("\n(prova: nulla è stato modificato — rilanciare con --apply, e --regrade per rivalutare)");
    return;
  }

  for (const [questionId, optionId] of fixes) {
    await prisma.$transaction([
      prisma.answerOption.updateMany({ where: { questionId }, data: { isCorrect: false } }),
      prisma.answerOption.update({ where: { id: optionId }, data: { isCorrect: true } }),
    ]);
  }
  console.log(`\nCorrette ${fixes.size} copie.`);

  if (doppie.length) {
    const del = await prisma.question.deleteMany({ where: { id: { in: doppie } } });
    console.log(`Rimosse ${del.count} copie doppie dalla banca dati.`);
  }

  if (REGRADE) {
    for (const r of regrades) {
      await prisma.$transaction([
        ...r.payload.results.map((res) =>
          prisma.answerRecord.updateMany({
            where: { attemptId: r.id, questionId: res.questionId },
            data: { isCorrect: res.isCorrect },
          })
        ),
        prisma.attempt.update({ where: { id: r.id }, data: { score: r.payload.score, maxScore: r.payload.maxScore } }),
        prisma.attemptSubjectStat.deleteMany({ where: { attemptId: r.id } }),
        prisma.attemptSubjectStat.createMany({
          data: [...r.subjects.entries()].map(([subject, s]) => ({ attemptId: r.id, subject, correct: s.correct, total: s.total })),
        }),
      ]);
    }
    console.log(`Rivalutati ${regrades.length} tentativi.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
