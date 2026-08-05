"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";

export async function startAttempt(formData: FormData): Promise<void> {
  const session = await requireStudent();
  const testId = String(formData.get("testId") ?? "");
  if (!testId) return;

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      assignments: { where: { studentId: session.user.id } },
      questions: { select: { id: true, points: true } },
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

  const maxScore = test.questions.reduce((sum, q) => sum + q.points, 0);

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
