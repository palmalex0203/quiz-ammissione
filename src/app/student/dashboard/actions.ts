"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { POINTS_CORRECT } from "@/lib/grading";
import { randomShuffle } from "@/lib/shuffle";

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

export async function generateRandomSimulation(): Promise<void> {
  const session = await requireStudent();

  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  if (!teacher) throw new Error("Nessun account insegnante trovato.");

  const questionsToCreate: {
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
    subject: string;
    text: string;
    options: { text: string; isCorrect: boolean }[];
  }[] = [];

  for (const block of OFFICIAL_STRUCTURE) {
    const pool = await prisma.question.findMany({
      where: { subject: block.subject, test: { kind: "POOL" } },
      include: { options: true },
    });
    if (pool.length < block.count) {
      throw new Error(`Domande insufficienti nel database per la materia "${block.subject}".`);
    }
    const picked = randomShuffle(pool).slice(0, block.count);
    for (const q of picked) {
      questionsToCreate.push({
        type: q.type,
        subject: q.subject,
        text: q.text,
        options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
      });
    }
  }

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
      questions: {
        create: questionsToCreate.map((q, i) => ({
          type: q.type,
          subject: q.subject,
          text: q.text,
          order: i + 1,
          options: {
            create: q.options.map((o, j) => ({ text: o.text, isCorrect: o.isCorrect, order: j + 1 })),
          },
        })),
      },
      assignments: { create: { studentId: session.user.id } },
    },
  });

  const maxScore = questionsToCreate.length * POINTS_CORRECT;

  await prisma.attempt.create({
    data: { testId: test.id, studentId: session.user.id, status: "IN_PROGRESS", maxScore },
  });

  redirect(`/student/tests/${test.id}/take`);
}
