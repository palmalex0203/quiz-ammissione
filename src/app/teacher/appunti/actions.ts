"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";

export type ActionState = { error?: string; salvato?: boolean };

export async function updateNote(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireTeacher();

  const topic = String(formData.get("topic") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!topic) return { error: "Argomento mancante." };
  if (!title) return { error: "Il titolo è obbligatorio." };
  if (!body) return { error: "L'appunto è vuoto." };

  const nota = await prisma.topicNote.findUnique({ where: { topic }, select: { id: true } });
  if (!nota) return { error: "Appunto non trovato." };

  await prisma.topicNote.update({ where: { topic }, data: { title, body } });

  revalidatePath(`/teacher/appunti/${topic}`);
  revalidatePath("/teacher/appunti");
  revalidatePath(`/student/appunti/${topic}`);
  return { salvato: true };
}

export async function togglePublishNote(formData: FormData): Promise<void> {
  await requireTeacher();

  const topic = String(formData.get("topic") ?? "");
  if (!topic) return;

  const nota = await prisma.topicNote.findUnique({ where: { topic }, select: { isPublished: true } });
  if (!nota) return;

  await prisma.topicNote.update({ where: { topic }, data: { isPublished: !nota.isPublished } });

  revalidatePath("/teacher/appunti");
  revalidatePath(`/teacher/appunti/${topic}`);
  revalidatePath(`/student/appunti/${topic}`);
  revalidatePath("/student/practice");
}
