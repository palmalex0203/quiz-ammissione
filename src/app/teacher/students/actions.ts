"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { requireTeacher } from "@/lib/permissions";

export type ActionState = { error?: string; success?: string };

export async function createStudent(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireTeacher();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "Compila tutti i campi." };
  }
  if (password.length < 6) {
    return { error: "La password deve avere almeno 6 caratteri." };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { name, email, passwordHash, role: "STUDENT" },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Esiste già uno studente con questa email." };
    }
    throw err;
  }

  revalidatePath("/teacher/students");
  return { success: "Studente creato." };
}

export async function resetStudentPassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireTeacher();

  const studentId = String(formData.get("studentId") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!studentId || !password) {
    return { error: "Dati mancanti." };
  }
  if (password.length < 6) {
    return { error: "La password deve avere almeno 6 caratteri." };
  }

  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student || student.role !== "STUDENT") {
    return { error: "Studente non trovato." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: studentId }, data: { passwordHash } });

  revalidatePath("/teacher/students");
  return { success: "Password aggiornata." };
}

export async function deleteStudent(formData: FormData): Promise<void> {
  await requireTeacher();

  const studentId = String(formData.get("studentId") ?? "");
  if (!studentId) return;

  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student || student.role !== "STUDENT") return;

  await prisma.user.delete({ where: { id: studentId } });
  revalidatePath("/teacher/students");
}
