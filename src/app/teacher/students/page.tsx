import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/EmptyState";
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
      <h1 className="page-title">Studenti</h1>

      <AddStudentForm />

      <div className="card p-5">
        {students.length === 0 ? (
          <EmptyState
            icon="🎓"
            title="Nessuno studente ancora"
            description="Aggiungi il primo studente con il modulo qui sopra."
            bare
          />
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
