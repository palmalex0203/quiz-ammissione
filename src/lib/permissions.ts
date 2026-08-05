import { auth } from "@/lib/auth";

export async function requireTeacher() {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    throw new Error("Non autorizzato");
  }
  return session;
}

export async function requireStudent() {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    throw new Error("Non autorizzato");
  }
  return session;
}
