"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { POINTS_CORRECT } from "@/lib/grading";
import { PRACTICE_SIZES } from "@/lib/subjects";
import {
  isKnownTopic,
  topicLabel,
  TOPIC_PRACTICE_SIZE,
  MIN_TOPIC_QUESTIONS,
} from "@/lib/topics";

// Struttura ricavata dalle simulazioni ufficiali CINECA già presenti sulla piattaforma:
// stesso ordine di materie, stesso numero di domande per materia (60 in totale).
const OFFICIAL_STRUCTURE: { subject: string; count: number }[] = [
  { subject: "Comprensione del testo", count: 4 },
  { subject: "Logica", count: 5 },
  { subject: "Biologia", count: 23 },
  { subject: "Chimica", count: 15 },
  { subject: "Fisica e Matematica", count: 13 },
];

export async function startAttempt(formData: FormData): Promise<void> {
  const session = await requireStudent();
  const testId = String(formData.get("testId") ?? "");
  if (!testId) return;

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      assignments: { where: { studentId: session.user.id } },
      questions: { select: { id: true } },
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

  const maxScore = test.questions.length * POINTS_CORRECT;

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
async function pickRandomQuestionIds(): Promise<string[]> {
  const subjectsList = OFFICIAL_STRUCTURE.map((b) => `'${b.subject.replace(/'/g, "''")}'`).join(",");
  const caseClauses = OFFICIAL_STRUCTURE.map(
    (b) => `WHEN '${b.subject.replace(/'/g, "''")}' THEN ${b.count}`
  ).join(" ");

  const rows = await prisma.$queryRawUnsafe<{ id: string; subject: string }[]>(`
    SELECT id, subject FROM (
      SELECT q.id, q.subject,
        ROW_NUMBER() OVER (PARTITION BY q.subject ORDER BY RANDOM()) as rn
      FROM "Question" q JOIN "Test" t ON q."testId" = t.id
      WHERE t.kind = 'POOL' AND q.subject IN (${subjectsList})
    )
    WHERE rn <= (CASE subject ${caseClauses} ELSE 0 END)
  `);

  const countBySubject = new Map<string, number>();
  for (const r of rows) countBySubject.set(r.subject, (countBySubject.get(r.subject) ?? 0) + 1);
  for (const block of OFFICIAL_STRUCTURE) {
    if ((countBySubject.get(block.subject) ?? 0) < block.count) {
      throw new Error(`Domande insufficienti nel database per la materia "${block.subject}".`);
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
  return OFFICIAL_STRUCTURE.flatMap((block) => bySubject.get(block.subject) ?? []);
}

// Da quanti giorni un test generato e mai consegnato è considerato abbandonato.
// Ampiamente oltre i 100 minuti di una simulazione: chi la sta svolgendo, o l'ha
// interrotta poco fa per riprenderla, non viene toccato.
const ABANDONED_AFTER_DAYS = 2;

// Ogni test generato conserva una copia di 60 domande e 300 opzioni. Senza pulizia
// le prove aperte e mai finite si accumulano all'infinito e appesantiscono il
// database di tutti: si eliminano quelle vecchie dello studente, che non
// contengono alcun punteggio, appena ne genera una nuova.
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
  title: string;
  description: string;
  orderedIds: string[];
  timeLimitMinutes: number;
}): Promise<string> {
  const duplicate = await findRecentDuplicate(opts.studentId, opts.title);
  if (duplicate) return duplicate.id;

  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  if (!teacher) throw new Error("Nessun account insegnante trovato.");

  await pruneAbandonedTests(opts.studentId);

  const questions = await prisma.question.findMany({
    where: { id: { in: opts.orderedIds } },
    include: { options: { orderBy: { order: "asc" } } },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));
  const orderedQuestions = opts.orderedIds.map((id) => byId.get(id)!);

  const test = await prisma.test.create({
    data: {
      title: opts.title,
      description: opts.description,
      createdById: teacher.id,
      isPublished: true,
      kind: "GENERATA",
      isGenerated: true,
      timeLimitMinutes: opts.timeLimitMinutes,
      assignments: { create: { studentId: opts.studentId } },
    },
  });

  // Inserimento in blocco (createMany) invece di create annidate: su un database
  // remoto una create annidata con ~60 domande e ~300 opzioni emette centinaia di
  // INSERT separate; createMany le raggruppa in pochissime query.
  const questionIds = orderedQuestions.map(() => crypto.randomUUID());
  await prisma.question.createMany({
    data: orderedQuestions.map((q, i) => ({
      id: questionIds[i],
      testId: test.id,
      type: q.type,
      subject: q.subject,
      topic: q.topic,
      text: q.text,
      order: i + 1,
    })),
  });

  const optionsData = orderedQuestions.flatMap((q, i) =>
    q.options.map((o, j) => ({
      id: crypto.randomUUID(),
      questionId: questionIds[i],
      text: o.text,
      isCorrect: o.isCorrect,
      order: j + 1,
    }))
  );
  await prisma.answerOption.createMany({ data: optionsData });

  const maxScore = orderedQuestions.length * POINTS_CORRECT;

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

export async function generateRandomSimulation(): Promise<void> {
  const session = await requireStudent();

  const testId = await createAndStartGeneratedTest({
    studentId: session.user.id,
    title: `Simulazione generata - ${nowLabel()}`,
    description:
      "Simulazione generata automaticamente pescando domande a caso dal database, con la stessa struttura (materie e numero di domande per materia) delle simulazioni ufficiali.",
    orderedIds: await pickRandomQuestionIds(),
    timeLimitMinutes: 100,
  });

  redirect(`/student/tests/${testId}/take`);
}

export async function generateSubjectPractice(formData: FormData): Promise<void> {
  const session = await requireStudent();

  // La materia arriva dal form: va confrontata con l'elenco noto, sia per non
  // costruire test su materie inesistenti sia perché finisce in una query.
  const subject = String(formData.get("subject") ?? "");
  const size = PRACTICE_SIZES[subject];
  if (!size) throw new Error("Materia non valida.");

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT q.id FROM "Question" q JOIN "Test" t ON q."testId" = t.id
    WHERE t.kind = 'POOL' AND q.subject = ${subject}
    ORDER BY RANDOM() LIMIT ${size}
  `;
  if (rows.length < size) {
    throw new Error(`Domande insufficienti nel database per la materia "${subject}".`);
  }

  const testId = await createAndStartGeneratedTest({
    studentId: session.user.id,
    title: `Esercitazione ${subject} - ${nowLabel()}`,
    description: `Esercitazione mirata su ${subject}, con ${size} domande pescate a caso dal database.`,
    orderedIds: rows.map((r) => r.id),
    // Stesso ritmo delle simulazioni ufficiali: 100 minuti per 60 domande.
    timeLimitMinutes: Math.round((size * 100) / 60),
  });

  redirect(`/student/tests/${testId}/take`);
}

export async function generateTopicPractice(formData: FormData): Promise<void> {
  const session = await requireStudent();

  // Il codice arriva dal form: si verifica che sia uno degli argomenti noti, sia per
  // non costruire test su argomenti inesistenti sia perché finisce in una query.
  const topic = String(formData.get("topic") ?? "");
  if (!isKnownTopic(topic)) throw new Error("Argomento non valido.");

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT q.id FROM "Question" q JOIN "Test" t ON q."testId" = t.id
    WHERE t.kind = 'POOL' AND q.topic = ${topic}
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
    title: `Esercitazione ${label} - ${nowLabel()}`,
    description: `Esercitazione mirata sull'argomento "${label}", con ${rows.length} domande pescate a caso dal database.`,
    orderedIds: rows.map((r) => r.id),
    timeLimitMinutes: Math.round((rows.length * 100) / 60),
  });

  redirect(`/student/tests/${testId}/take`);
}
