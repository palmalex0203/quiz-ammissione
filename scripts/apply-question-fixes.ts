/**
 * Applica una lista di correzioni, decise a mano, alle domande del database.
 *
 * Ogni correzione indica una domanda (per id) e agisce su tutte le sue copie: la stessa
 * domanda, con lo stesso testo e le stesse opzioni, compare nella banca dati, nelle
 * simulazioni, nelle esercitazioni e nei test generati per gli studenti. Le copie vengono
 * individuate prima di qualsiasi modifica, confrontando testo e insieme delle opzioni.
 *
 * Formato del file JSON: un array di oggetti con
 *   id           una qualsiasi copia della domanda
 *   correct      testo (attuale) dell'opzione che deve diventare quella corretta
 *   text         nuovo testo della domanda
 *   textReplace  [[da, a], ...] sostituzioni dentro il testo della domanda
 *   options      [[da, a], ...] rinomina l'opzione il cui testo è esattamente "da"
 *   setOptions   [testo, ...] riscrive tutte le opzioni, nel loro ordine
 *   subject      nuova materia
 *   topic        nuovo argomento
 *   poolOnly     materia e argomento cambiano solo nelle copie della banca dati
 *   archive      toglie la domanda dalla banca dati
 *   dedupePool   lascia in banca dati una sola copia, togliendo i doppioni
 *
 * In ogni caso, da tutte le opzioni vengono tolti i piè di pagina rimasti dai PDF
 * ("Università degli Studi …", "CdL delle Professioni Sanitarie", "*** FINE DELLE DOMANDE").
 *
 * Le domande tolte dalla banca dati non vengono cancellate: passano al test "Archivio -
 * domande scartate" (kind ARCHIVIO), che non compare a studenti e insegnante e che il
 * generatore di simulazioni ignora. Per recuperarle basta riportarle nel test d'origine.
 *
 * Quando cambia la risposta corretta di una domanda già usata, i tentativi consegnati
 * vengono rivalutati: risposte, punteggio e statistiche per materia.
 *
 * Senza --apply non modifica nulla e mostra soltanto cosa cambierebbe.
 *
 * Uso: npx tsx scripts/apply-question-fixes.ts <correzioni.json> [--apply]
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";
import { gradeAttempt } from "../src/lib/grading";
import { isKnownTopic } from "../src/lib/topics";

type Fix = {
  id: string;
  correct?: string;
  text?: string;
  textReplace?: [string, string][];
  options?: [string, string][];
  setOptions?: string[];
  subject?: string;
  topic?: string;
  poolOnly?: boolean;
  archive?: boolean;
  dedupePool?: boolean;
};

const APPLY = process.argv.includes("--apply");
const FILE = process.argv.slice(2).find((a) => !a.startsWith("--"));
const ARCHIVE_TITLE = "Archivio - domande scartate";
const SUBJECTS = ["Biologia", "Chimica", "Fisica e Matematica", "Logica", "Comprensione del testo", "Cultura generale"];
const FOOTER = /\s+(?:Università degli Studi\b.*|CdL delle Professioni Sanitarie.*|\*{5,}.*)$/;

const norm = (s: string) =>
  s.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ").replace(/[\s:?.]+$/, "").trim();
const short = (s: string, n = 90) => {
  const t = s.replace(/\s+/g, " ");
  return t.length > n ? "…" + t.slice(-n) : t;
};

async function main() {
  if (!FILE) throw new Error("Uso: npx tsx scripts/apply-question-fixes.ts <correzioni.json> [--apply]");
  const fixes = JSON.parse(readFileSync(FILE, "utf8")) as Fix[];
  for (const f of fixes) {
    if (f.topic && !isKnownTopic(f.topic)) throw new Error(`Argomento sconosciuto "${f.topic}"`);
    if (f.subject && !SUBJECTS.includes(f.subject)) throw new Error(`Materia sconosciuta "${f.subject}"`);
  }

  const questions = await prisma.question.findMany({
    select: {
      id: true, text: true, subject: true, topic: true,
      test: { select: { kind: true } },
      options: { select: { id: true, text: true, isCorrect: true }, orderBy: { order: "asc" } },
    },
  });
  type Q = (typeof questions)[number];
  const keyOf = (q: Q) => norm(q.text) + "||" + q.options.map((o) => norm(o.text)).sort().join("|");
  const groups = new Map<string, Q[]>();
  for (const q of questions) groups.set(keyOf(q), [...(groups.get(keyOf(q)) ?? []), q]);
  const byId = new Map(questions.map((q) => [q.id, q]));

  // Stato finale di ogni domanda toccata: si parte da quello attuale e si applicano le correzioni.
  type Plan = { text: string; subject: string; topic: string | null; archive: boolean; options: Map<string, string>; correctId: string | null };
  const plans = new Map<string, Plan>();
  const planOf = (q: Q): Plan => {
    let p = plans.get(q.id);
    if (!p) {
      p = {
        text: q.text, subject: q.subject, topic: q.topic, archive: false,
        options: new Map(q.options.map((o) => [o.id, o.text])),
        correctId: q.options.find((o) => o.isCorrect)?.id ?? null,
      };
      plans.set(q.id, p);
    }
    return p;
  };

  for (const f of fixes) {
    const ref = byId.get(f.id);
    if (!ref) throw new Error(`Domanda ${f.id} non trovata`);
    const copies = groups.get(keyOf(ref))!;
    for (const q of copies) {
      const p = planOf(q);
      if (f.correct !== undefined) {
        const target = q.options.find((o) => norm(o.text) === norm(f.correct!));
        if (!target) throw new Error(`Opzione "${f.correct}" non trovata nella domanda ${q.id}`);
        p.correctId = target.id;
      }
      if (f.text !== undefined) p.text = f.text;
      for (const [from, to] of f.textReplace ?? []) {
        if (!p.text.includes(from)) throw new Error(`"${from}" non compare nel testo della domanda ${q.id}`);
        p.text = p.text.split(from).join(to);
      }
      for (const [from, to] of f.options ?? []) {
        const hits = q.options.filter((o) => o.text === from);
        if (hits.length !== 1) throw new Error(`Opzione "${from}" trovata ${hits.length} volte nella domanda ${q.id}`);
        p.options.set(hits[0].id, to);
      }
      if (f.setOptions) {
        if (f.setOptions.length !== q.options.length) throw new Error(`setOptions: numero di opzioni diverso nella domanda ${q.id}`);
        q.options.forEach((o, i) => p.options.set(o.id, f.setOptions![i]));
      }
      if (!f.poolOnly || q.test.kind === "POOL") {
        if (f.subject) p.subject = f.subject;
        if (f.topic) p.topic = f.topic;
      }
    }
    const pool = copies.filter((c) => c.test.kind === "POOL");
    if (f.archive) for (const q of pool) planOf(q).archive = true;
    if (f.dedupePool) for (const q of pool.slice(1)) planOf(q).archive = true;
  }

  // Piè di pagina dei PDF finiti dentro le opzioni.
  const footers = new Map<string, string>();
  for (const q of questions) {
    for (const o of q.options) {
      const current = plans.get(q.id)?.options.get(o.id) ?? o.text;
      const cleaned = current.replace(FOOTER, "");
      if (cleaned !== current) {
        planOf(q).options.set(o.id, cleaned);
        footers.set(current, cleaned);
      }
    }
  }

  // Riepilogo: una riga per ogni domanda distinta, con il numero di copie coinvolte.
  const keyChanges = new Map<string, string>();
  const shown = new Set<string>();
  let touched = 0;
  const archived: Q[] = [];
  for (const [id, p] of plans) {
    const q = byId.get(id)!;
    const diffs: string[] = [];
    if (p.text !== q.text) diffs.push(`   testo: ${short(q.text)}\n       →  ${short(p.text)}`);
    if (p.subject !== q.subject) diffs.push(`   materia: ${q.subject} → ${p.subject}`);
    if (p.topic !== q.topic) diffs.push(`   argomento: ${q.topic ?? "—"} → ${p.topic ?? "—"}`);
    for (const o of q.options) {
      const t = p.options.get(o.id)!;
      if (t !== o.text && !footers.has(o.text)) diffs.push(`   opzione: ${JSON.stringify(o.text)} → ${JSON.stringify(t)}`);
    }
    const oldCorrect = q.options.find((o) => o.isCorrect)?.id ?? null;
    if (p.correctId !== oldCorrect) {
      keyChanges.set(id, p.correctId!);
      diffs.push(`   RISPOSTA CORRETTA: ${JSON.stringify(q.options.find((o) => o.id === oldCorrect)?.text)} → ${JSON.stringify(q.options.find((o) => o.id === p.correctId)?.text)}`);
    }
    if (p.archive) {
      archived.push(q);
      diffs.push("   tolta dalla banca dati (archiviata)");
    }
    const footerOnly = diffs.length === 0;
    if (footerOnly && ![...p.options.entries()].some(([oid, t]) => t !== q.options.find((o) => o.id === oid)!.text)) continue;
    touched++;
    if (footerOnly) continue;
    const sig = keyOf(q) + diffs.join();
    if (shown.has(sig)) continue;
    shown.add(sig);
    const n = groups.get(keyOf(q))!.length;
    console.log(`\n• [${q.test.kind}] ${short(q.text, 100)}  (${n} copie)\n${diffs.join("\n")}`);
  }
  if (footers.size) {
    console.log("\nPiè di pagina tolti dalle opzioni:");
    for (const [from, to] of footers) console.log(`   ${JSON.stringify(short(from, 120))} → ${JSON.stringify(to)}`);
  }
  console.log(`\nCopie da modificare: ${touched}; soluzioni che cambiano: ${keyChanges.size}; copie tolte dalla banca dati: ${archived.length}`);

  const regrades = await computeRegrades(keyChanges);
  const changed = regrades.filter((r) => r.before !== r.after);
  console.log(`Tentativi consegnati da rivalutare: ${regrades.length}, con punteggio che cambia: ${changed.length}`);
  for (const r of changed) console.log(`   ${r.student.padEnd(24)} ${r.test.slice(0, 44).padEnd(44)} ${r.before} → ${r.after}`);

  if (!APPLY) {
    console.log("\n(prova: nulla è stato modificato — rilanciare con --apply)");
    return;
  }

  let archiveId: string | null = null;
  if (archived.length) {
    const existing = await prisma.test.findFirst({ where: { title: ARCHIVE_TITLE, kind: "ARCHIVIO" } });
    const teacher = await prisma.user.findFirstOrThrow({ where: { role: "TEACHER" } });
    archiveId = existing?.id ?? (await prisma.test.create({
      data: {
        title: ARCHIVE_TITLE,
        description: "Domande tolte dalla banca dati durante le revisioni: non vengono usate da nessuna parte.",
        createdById: teacher.id, isPublished: false, kind: "ARCHIVIO",
      },
    })).id;
  }

  for (const [id, p] of plans) {
    const q = byId.get(id)!;
    const ops = [];
    if (p.text !== q.text || p.subject !== q.subject || p.topic !== q.topic || p.archive) {
      ops.push(prisma.question.update({
        where: { id },
        data: { text: p.text, subject: p.subject, topic: p.topic, ...(p.archive ? { testId: archiveId! } : {}) },
      }));
    }
    for (const o of q.options) {
      const t = p.options.get(o.id)!;
      if (t !== o.text) ops.push(prisma.answerOption.update({ where: { id: o.id }, data: { text: t } }));
    }
    if (keyChanges.has(id)) {
      ops.push(prisma.answerOption.updateMany({ where: { questionId: id }, data: { isCorrect: false } }));
      ops.push(prisma.answerOption.update({ where: { id: keyChanges.get(id)! }, data: { isCorrect: true } }));
    }
    if (ops.length) await prisma.$transaction(ops);
  }
  console.log(`\nApplicate le modifiche a ${touched} copie.`);

  for (const r of regrades) {
    await prisma.$transaction([
      ...r.results.map((res) =>
        prisma.answerRecord.updateMany({ where: { attemptId: r.id, questionId: res.questionId }, data: { isCorrect: res.isCorrect } })
      ),
      prisma.attempt.update({ where: { id: r.id }, data: { score: r.after, maxScore: r.maxScore } }),
      prisma.attemptSubjectStat.deleteMany({ where: { attemptId: r.id } }),
      prisma.attemptSubjectStat.createMany({
        data: [...r.subjects.entries()].map(([subject, s]) => ({ attemptId: r.id, subject, correct: s.correct, total: s.total })),
      }),
    ]);
  }
  console.log(`Rivalutati ${regrades.length} tentativi.`);
}

// Ricalcola i tentativi consegnati che contengono domande con la soluzione cambiata,
// usando già le soluzioni nuove (così funziona anche in prova, a database invariato).
async function computeRegrades(keyChanges: Map<string, string>) {
  const records = await prisma.answerRecord.findMany({
    where: { questionId: { in: [...keyChanges.keys()] }, attempt: { status: "SUBMITTED" } },
    select: { attemptId: true },
  });
  const out = [];
  for (const attemptId of new Set(records.map((r) => r.attemptId))) {
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true, score: true, testId: true,
        student: { select: { name: true } }, test: { select: { title: true } },
        answers: { select: { questionId: true, selectedOptionId: true } },
      },
    });
    if (!attempt) continue;
    const qs = await prisma.question.findMany({
      where: { testId: attempt.testId },
      select: { id: true, subject: true, options: { select: { id: true, isCorrect: true } } },
    });
    const graded = gradeAttempt(
      qs.map((q) => ({
        id: q.id,
        options: q.options.map((o) => ({ id: o.id, isCorrect: keyChanges.has(q.id) ? o.id === keyChanges.get(q.id) : o.isCorrect })),
      })),
      attempt.answers
    );
    const subjectOf = new Map(qs.map((q) => [q.id, q.subject]));
    const subjects = new Map<string, { correct: number; total: number }>();
    for (const r of graded.results) {
      const s = subjectOf.get(r.questionId);
      if (!s) continue;
      const st = subjects.get(s) ?? { correct: 0, total: 0 };
      st.total++;
      if (r.isCorrect) st.correct++;
      subjects.set(s, st);
    }
    out.push({
      id: attempt.id, student: attempt.student.name, test: attempt.test.title,
      before: attempt.score ?? 0, after: graded.score, maxScore: graded.maxScore, results: graded.results, subjects,
    });
  }
  return out;
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
