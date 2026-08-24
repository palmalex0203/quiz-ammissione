"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { POINTS_CORRECT } from "@/lib/grading";

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

export async function generateRandomSimulation(): Promise<void> {
  const session = await requireStudent();

  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  if (!teacher) throw new Error("Nessun account insegnante trovato.");

  const orderedIds = await pickRandomQuestionIds();

  const questions = await prisma.question.findMany({
    where: { id: { in: orderedIds } },
    include: { options: { orderBy: { order: "asc" } } },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));
  const orderedQuestions = orderedIds.map((id) => byId.get(id)!);

  const label = new Date().toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const test = await prisma.test.create({
    data: {
      title: `Simulazione generata - ${label}`,
      description:
        "Simulazione generata automaticamente pescando domande a caso dal database, con la stessa struttura (materie e numero di domande per materia) delle simulazioni ufficiali.",
      createdById: teacher.id,
      isPublished: true,
      kind: "GENERATA",
      isGenerated: true,
      timeLimitMinutes: 100,
      assignments: { create: { studentId: session.user.id } },
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
    data: { testId: test.id, studentId: session.user.id, status: "IN_PROGRESS", maxScore },
  });

  redirect(`/student/tests/${test.id}/take`);
}
