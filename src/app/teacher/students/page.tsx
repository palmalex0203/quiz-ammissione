import { prisma } from "@/lib/prisma";
import { AddStudentForm } from "./AddStudentForm";
import { StudentRow } from "./StudentRow";

export default async function StudentsPage() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { name: "asc" },
    include: { _count: { select: { attempts: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Studenti</h1>

      <AddStudentForm />

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        {students.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Nessuno studente ancora.</p>
        ) : (
          students.map((student) => (
            <StudentRow
              key={student.id}
              student={{
                id: student.id,
                name: student.name,
                email: student.email,
                attemptCount: student._count.attempts,
                createdAt: student.createdAt.toISOString(),
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
