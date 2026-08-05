"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";

export type ActionState = { error?: string };

export async function createTest(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireTeacher();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) {
    return { error: "Il titolo è obbligatorio." };
  }

  const test = await prisma.test.create({
    data: {
      title,
      description: description || null,
      createdById: session.user.id,
    },
  });

  revalidatePath("/teacher/tests");
  redirect(`/teacher/tests/${test.id}/edit`);
}

export async function deleteTest(formData: FormData): Promise<void> {
  const session = await requireTeacher();
  const testId = String(formData.get("testId") ?? "");
  if (!testId) return;

  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test || test.createdById !== session.user.id) return;

  await prisma.test.delete({ where: { id: testId } });
  revalidatePath("/teacher/tests");
}

export async function togglePublish(formData: FormData): Promise<void> {
  const session = await requireTeacher();
  const testId = String(formData.get("testId") ?? "");
  if (!testId) return;

  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test || test.createdById !== session.user.id) return;

  await prisma.test.update({ where: { id: testId }, data: { isPublished: !test.isPublished } });
  revalidatePath("/teacher/tests");
}
