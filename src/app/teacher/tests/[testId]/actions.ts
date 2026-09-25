"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";
import { isTrackId } from "@/lib/tracks";

export type ActionState = { error?: string };

type OptionInput = { text: string; isCorrect: boolean };

async function assertOwnsTest(testId: string, teacherId: string) {
  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test || test.createdById !== teacherId) {
    throw new Error("Test non trovato.");
  }
  return test;
}

function parseOptions(raw: string): OptionInput[] | null {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const options = parsed
      .map((o) => ({ text: String(o.text ?? "").trim(), isCorrect: Boolean(o.isCorrect) }))
      .filter((o) => o.text.length > 0);
    return options;
  } catch {
    return null;
  }
}

export async function updateTestSettings(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireTeacher();
  const testId = String(formData.get("testId") ?? "");
  await assertOwnsTest(testId, session.user.id);

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const shuffleQuestions = formData.get("shuffleQuestions") === "on";
  const timeLimitRaw = String(formData.get("timeLimitMinutes") ?? "").trim();
  const maxAttemptsRaw = String(formData.get("maxAttempts") ?? "").trim();
  const trackValue = formData.get("track");

  if (!title) {
    return { error: "Il titolo è obbligatorio." };
  }

  await prisma.test.update({
    where: { id: testId },
    data: {
      title,
      description: description || null,
      ...(isTrackId(trackValue) ? { track: trackValue } : {}),
      shuffleQuestions,
      timeLimitMinutes: timeLimitRaw ? Number(timeLimitRaw) : null,
      maxAttempts: maxAttemptsRaw ? Number(maxAttemptsRaw) : null,
    },
  });

  revalidatePath(`/teacher/tests/${testId}/edit`);
  return {};
}

export async function addQuestion(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireTeacher();
  const testId = String(formData.get("testId") ?? "");
  await assertOwnsTest(testId, session.user.id);

  const subject = String(formData.get("subject") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  const options = parseOptions(String(formData.get("optionsJson") ?? "[]"));

  if (!subject || !text) {
    return { error: "Materia e testo della domanda sono obbligatori." };
  }
  if (type !== "MULTIPLE_CHOICE" && type !== "TRUE_FALSE") {
    return { error: "Tipo di domanda non valido." };
  }
  if (!options || options.length < 2) {
    return { error: "Servono almeno due opzioni di risposta." };
  }
  if (options.filter((o) => o.isCorrect).length !== 1) {
    return { error: "Seleziona esattamente una risposta corretta." };
  }

  const lastQuestion = await prisma.question.findFirst({
    where: { testId },
    orderBy: { order: "desc" },
  });
  const nextOrder = (lastQuestion?.order ?? 0) + 1;

  await prisma.question.create({
    data: {
      testId,
      subject,
      type,
      text,
      order: nextOrder,
      options: {
        create: options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, order: i + 1 })),
      },
    },
  });

  revalidatePath(`/teacher/tests/${testId}/edit`);
  return {};
}

export async function updateQuestion(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireTeacher();
  const testId = String(formData.get("testId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  await assertOwnsTest(testId, session.user.id);

  const subject = String(formData.get("subject") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  const options = parseOptions(String(formData.get("optionsJson") ?? "[]"));

  if (!subject || !text) {
    return { error: "Materia e testo della domanda sono obbligatori." };
  }
  if (type !== "MULTIPLE_CHOICE" && type !== "TRUE_FALSE") {
    return { error: "Tipo di domanda non valido." };
  }
  if (!options || options.length < 2) {
    return { error: "Servono almeno due opzioni di risposta." };
  }
  if (options.filter((o) => o.isCorrect).length !== 1) {
    return { error: "Seleziona esattamente una risposta corretta." };
  }

  await prisma.$transaction([
    prisma.answerOption.deleteMany({ where: { questionId } }),
    prisma.question.update({
      where: { id: questionId },
      data: {
        subject,
        type,
        text,
        options: {
          create: options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, order: i + 1 })),
        },
      },
    }),
  ]);

  revalidatePath(`/teacher/tests/${testId}/edit`);
  return {};
}

export async function deleteQuestion(formData: FormData): Promise<void> {
  const session = await requireTeacher();
  const testId = String(formData.get("testId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  await assertOwnsTest(testId, session.user.id);

  await prisma.question.delete({ where: { id: questionId } });
  revalidatePath(`/teacher/tests/${testId}/edit`);
}

export async function moveQuestion(formData: FormData): Promise<void> {
  const session = await requireTeacher();
  const testId = String(formData.get("testId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  await assertOwnsTest(testId, session.user.id);

  const questions = await prisma.question.findMany({ where: { testId }, orderBy: { order: "asc" } });
  const index = questions.findIndex((q) => q.id === questionId);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= questions.length) return;

  const current = questions[index];
  const swapWith = questions[swapIndex];

  await prisma.$transaction([
    prisma.question.update({ where: { id: current.id }, data: { order: swapWith.order } }),
    prisma.question.update({ where: { id: swapWith.id }, data: { order: current.order } }),
  ]);

  revalidatePath(`/teacher/tests/${testId}/edit`);
}
