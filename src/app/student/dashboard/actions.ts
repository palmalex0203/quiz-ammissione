"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { currentTrack } from "@/lib/track-session";
import {
  maxScoreFor,
  paperOf,
  simulationSize,
  trackOf,
  type Track,
  type TrackId,
} from "@/lib/tracks";
import {
  isKnownTopic,
  topicLabel,
  topicTrack,
  TOPIC_PRACTICE_SIZE,
  MIN_TOPIC_QUESTIONS,
} from "@/lib/topics";
import { wrongQuestionIds, REVIEW_SIZE } from "@/lib/review";
import { questionCountOf, questionCountSelect } from "@/lib/test-questions";

export async function startAttempt(formData: FormData): Promise<void> {
  const session = await requireStudent();
  const testId = String(formData.get("testId") ?? "");
  if (!testId) return;

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      assignments: { where: { studentId: session.user.id } },
      _count: { select: questionCountSelect },
    },
  });

  if (!test || !test.isPublished) {
    throw new Error("Test non disponibile.");
  }

  const hasAssignments = await prisma.testAssignment.count({ where: { testId } });
  const isAssignedToMe = test.assignments.length > 0;
  if (hasAssignments > 0 && !isAssignedToMe) {
    throw new Error("Test non assegnato.");
  }

  const existingInProgress = await prisma.attempt.findFirst({
    where: { testId, studentId: session.user.id, status: "IN_PROGRESS" },
  });

  if (existingInProgress) {
    redirect(`/student/tests/${testId}/take`);
  }

  if (test.maxAttempts != null) {
    const attemptCount = await prisma.attempt.count({ where: { testId, studentId: session.user.id } });
    if (attemptCount >= test.maxAttempts) {
      throw new Error("Numero massimo di tentativi raggiunto.");
    }
  }

  // Il punteggio pieno dipende dal percorso del test, non da quello aperto adesso.
  const maxScore = maxScoreFor(trackOf(test.track), questionCountOf(test._count));

  await prisma.attempt.create({
    data: {
      testId,
      studentId: session.user.id,
      status: "IN_PROGRESS",
      maxScore,
    },
  });

  redirect(`/student/tests/${testId}/take`);
}

// Pesca gli ID delle domande casuali direttamente nel database con un'unica query
// (window function ORDER BY RANDOM() per materia), invece di scaricare l'intera banca
// dati di ogni materia in memoria e mescolarla in JavaScript: molto più veloce,
// soprattutto su un database remoto dove ogni query ha un costo di rete fisso.
async function pickRandomQuestionIds(track: Track): Promise<string[]> {
  const blocks = track.simulation.blocks;
  const quoted = (s: string) => `'${s.replace(/'/g, "''")}'`;
  const subjectsList = blocks.map((b) => quoted(b.subject)).join(",");
  const caseClauses = blocks.map((b) => `WHEN ${quoted(b.subject)} THEN ${b.count}`).join(" ");

  const rows = await prisma.$queryRawUnsafe<{ id: string; subject: string }[]>(
    `
    SELECT id, subject FROM (
      SELECT q.id, q.subject,
        ROW_NUMBER() OVER (PARTITION BY q.subject ORDER BY RANDOM()) as rn
      FROM "Question" q JOIN "Test" t ON q."testId" = t.id
      WHERE t.kind = 'POOL' AND t.track = $1 AND q.subject IN (${subjectsList})
    ) AS pescate
    WHERE rn <= (CASE subject ${caseClauses} ELSE 0 END)
  `,
    track.id
  );

  const countBySubject = new Map<string, number>();
  for (const r of rows) countBySubject.set(r.subject, (countBySubject.get(r.subject) ?? 0) + 1);
  for (const block of blocks) {
    if ((countBySubject.get(block.subject) ?? 0) < block.count) {
      throw new Error(
        `La banca dati di ${track.label} non ha ancora abbastanza domande di "${block.subject}".`
      );
    }
  }

  // Riordina gli id secondo l'ordine ufficiale delle materie (la query sopra li
  // restituisce raggruppati per materia ma non necessariamente nell'ordine voluto).
  const bySubject = new Map<string, string[]>();
  for (const r of rows) {
    const list = bySubject.get(r.subject) ?? [];
    list.push(r.id);
    bySubject.set(r.subject, list);
  }
  return blocks.flatMap((block) => bySubject.get(block.subject) ?? []);
}

// Da quanti giorni un test generato e mai consegnato è considerato abbandonato.
// Ampiamente oltre la durata di una simulazione: chi la sta svolgendo, o l'ha
// interrotta poco fa per riprenderla, non viene toccato.
const ABANDONED_AFTER_DAYS = 2;

// Le prove aperte e mai finite si accumulerebbero all'infinito: si eliminano quelle
// vecchie dello studente, che non contengono alcun punteggio, appena ne genera una
// nuova. Adesso che le domande sono richiamate e non copiate pesano molto meno, ma
// restano comunque righe che nessuno leggerà mai più.
async function pruneAbandonedTests(studentId: string) {
  const cutoff = new Date(Date.now() - ABANDONED_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const abandoned = await prisma.test.findMany({
    where: {
      kind: "GENERATA",
      createdAt: { lt: cutoff },
      assignments: { some: { studentId } },
      attempts: { none: { OR: [{ status: "SUBMITTED" }, { startedAt: { gte: cutoff } }] } },
    },
    select: { id: true },
  });
  if (abandoned.length === 0) return;
  await prisma.test.deleteMany({ where: { id: { in: abandoned.map((t) => t.id) } } });
}

// Finestra entro cui una seconda richiesta identica è considerata un doppio click
// e non una nuova richiesta volontaria. Il pulsante si disabilita già nel browser,
// ma quel blocco scatta solo al re-render: due click nello stesso istante lo
// aggirano, e senza questo controllo nascerebbero test doppi.
const DOUBLE_SUBMIT_WINDOW_MS = 30_000;

// Se lo studente ha già aperto pochi secondi fa un test dello stesso tipo e non
// l'ha ancora consegnato, restituisce quello invece di crearne un altro.
async function findRecentDuplicate(studentId: string, title: string) {
  // Il titolo contiene la data ("Simulazione generata - 04/09/2026, 18:40"): si
  // confronta solo la parte iniziale, che identifica il tipo di richiesta.
  const prefix = title.split(" - ")[0];
  return prisma.test.findFirst({
    where: {
      kind: "GENERATA",
      title: { startsWith: prefix },
      createdAt: { gte: new Date(Date.now() - DOUBLE_SUBMIT_WINDOW_MS) },
      assignments: { some: { studentId } },
      attempts: { some: { studentId, status: "IN_PROGRESS" } },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
}

// Crea un test generato a partire da un elenco ordinato di id di domande della banca
// dati, lo assegna allo studente e apre subito un tentativo. Condiviso fra la
// simulazione completa e l'esercitazione mirata su una singola materia.
async function createAndStartGeneratedTest(opts: {
  studentId: string;
  trackId: TrackId;
  title: string;
  description: string;
  orderedIds: string[];
  // null = nessun cronometro: il ripasso non è una prova a tempo.
  timeLimitMinutes: number | null;
}): Promise<string> {
  const duplicate = await findRecentDuplicate(opts.studentId, opts.title);
  if (duplicate) return duplicate.id;

  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  if (!teacher) throw new Error("Nessun account insegnante trovato.");

  await pruneAbandonedTests(opts.studentId);

  // Le domande non si copiano: il test ne registra il riferimento e l'ordine.
  // Si controlla solo che esistano ancora tutte, perché fra il momento in cui sono
  // state pescate e adesso l'insegnante potrebbe averne tolta qualcuna.
  const esistenti = await prisma.question.findMany({
    where: { id: { in: opts.orderedIds } },
    select: { id: true },
  });
  const disponibili = new Set(esistenti.map((q) => q.id));
  const orderedIds = opts.orderedIds.filter((id) => disponibili.has(id));
  if (orderedIds.length === 0) throw new Error("Le domande pescate non sono più disponibili.");

  const test = await prisma.test.create({
    data: {
      title: opts.title,
      description: opts.description,
      createdById: teacher.id,
      isPublished: true,
      kind: "GENERATA",
      track: opts.trackId,
      isGenerated: true,
      timeLimitMinutes: opts.timeLimitMinutes,
      assignments: { create: { studentId: opts.studentId } },
    },
  });

  await prisma.testQuestion.createMany({
    data: orderedIds.map((questionId, i) => ({ testId: test.id, questionId, order: i + 1 })),
  });

  const maxScore = maxScoreFor(trackOf(opts.trackId), orderedIds.length);

  await prisma.attempt.create({
    data: { testId: test.id, studentId: opts.studentId, status: "IN_PROGRESS", maxScore },
  });

  return test.id;
}

function nowLabel() {
  return new Date().toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Tempo proporzionato al ritmo della prova ufficiale del percorso.
function minutesFor(track: Track, questions: number): number {
  return Math.max(1, Math.round((questions * track.simulation.minutes) / simulationSize(track)));
}

export async function generateRandomSimulation(): Promise<void> {
  const session = await requireStudent();
  const track = await currentTrack(session.user.id);

  const testId = await createAndStartGeneratedTest({
    studentId: session.user.id,
    trackId: track.id,
    title: `Simulazione ${track.label} - ${nowLabel()}`,
    description: `Simulazione generata pescando domande a caso dalla banca dati ${track.label}, con la struttura della prova ufficiale. ${track.simulation.description}`,
    orderedIds: await pickRandomQuestionIds(track),
    timeLimitMinutes: track.simulation.minutes,
  });

  redirect(`/student/tests/${testId}/take`);
}

export async function generateSubjectPractice(formData: FormData): Promise<void> {
  const session = await requireStudent();
  const track = await currentTrack(session.user.id);

  // La materia arriva dal form: va confrontata con l'elenco del percorso, sia per
  // non costruire test su materie inesistenti sia perché finisce in una query.
  const subject = String(formData.get("subject") ?? "");
  const paper = paperOf(track, subject);
  const size = paper?.questions ?? track.practiceSizes[subject];
  if (!size) throw new Error("Materia non valida.");

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT q.id FROM "Question" q JOIN "Test" t ON q."testId" = t.id
    WHERE t.kind = 'POOL' AND t.track = ${track.id} AND q.subject = ${subject}
    ORDER BY RANDOM() LIMIT ${size}
  `;
  if (rows.length < size) {
    throw new Error(`La banca dati di ${track.label} non ha ancora abbastanza domande di "${subject}".`);
  }

  // Dove l'esame prevede una prova di materia (semestre filtro) si usano le sue
  // regole: stesse domande, stessi minuti della prova vera.
  const testId = await createAndStartGeneratedTest({
    studentId: session.user.id,
    trackId: track.id,
    title: `${paper ? "Prova" : "Esercitazione"} ${subject} - ${nowLabel()}`,
    description: paper
      ? `Prova di ${subject} nel formato ufficiale: ${paper.questions} domande in ${paper.minutes} minuti.`
      : `Esercitazione mirata su ${subject}, con ${size} domande pescate a caso dalla banca dati.`,
    orderedIds: rows.map((r) => r.id),
    timeLimitMinutes: paper?.minutes ?? minutesFor(track, size),
  });

  redirect(`/student/tests/${testId}/take`);
}

export async function generateTopicPractice(formData: FormData): Promise<void> {
  const session = await requireStudent();

  // Il codice arriva dal form: si verifica che sia uno degli argomenti noti, sia per
  // non costruire test su argomenti inesistenti sia perché finisce in una query.
  const topic = String(formData.get("topic") ?? "");
  if (!isKnownTopic(topic)) throw new Error("Argomento non valido.");

  // Il percorso lo decide l'argomento stesso: ogni codice appartiene a uno solo.
  const track = trackOf(topicTrack(topic));

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT q.id FROM "Question" q JOIN "Test" t ON q."testId" = t.id
    WHERE t.kind = 'POOL' AND t.track = ${track.id} AND q.topic = ${topic}
    ORDER BY RANDOM() LIMIT ${TOPIC_PRACTICE_SIZE}
  `;
  // Alcuni argomenti hanno meno domande della misura standard: l'esercitazione si
  // adatta invece di fallire, purché ce ne siano abbastanza da avere senso.
  if (rows.length < MIN_TOPIC_QUESTIONS) {
    throw new Error("Non ci sono ancora abbastanza domande su questo argomento.");
  }

  const label = topicLabel(topic) ?? topic;
  const testId = await createAndStartGeneratedTest({
    studentId: session.user.id,
    trackId: track.id,
    title: `Esercitazione ${label} - ${nowLabel()}`,
    description: `Esercitazione mirata sull'argomento "${label}", con ${rows.length} domande pescate a caso dalla banca dati.`,
    orderedIds: rows.map((r) => r.id),
    timeLimitMinutes: minutesFor(track, rows.length),
  });

  redirect(`/student/tests/${testId}/take`);
}

// Ripasso errori: le domande sbagliate e non ancora recuperate tornano in un test
// senza cronometro, dalla più recente alla più vecchia.
export async function generateErrorReview(): Promise<void> {
  const session = await requireStudent();
  const track = await currentTrack(session.user.id);

  const ids = await wrongQuestionIds(session.user.id, track.id, REVIEW_SIZE);
  if (ids.length === 0) {
    throw new Error("Non ci sono errori da ripassare: per ora hai rimesso a posto tutto.");
  }

  const testId = await createAndStartGeneratedTest({
    studentId: session.user.id,
    trackId: track.id,
    title: `Ripasso errori - ${nowLabel()}`,
    description: `Le ${ids.length} domande che hai sbagliato e non hai ancora recuperato. Senza tempo: prenditela con calma.`,
    orderedIds: ids,
    timeLimitMinutes: null,
  });

  redirect(`/student/tests/${testId}/take`);
}
