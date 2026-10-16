import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/EmptyState";
import { requireTeacherTrack } from "@/lib/track-docente";
import { AddStudentForm } from "./AddStudentForm";
import { StudentRow } from "./StudentRow";

export default async function StudentsPage() {
  const { trackId, track } = await requireTeacherTrack();

  const students = await prisma.user.findMany({
    where: { role: "STUDENT", track: trackId },
    orderBy: { name: "asc" },
    include: { _count: { select: { attempts: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Studenti</h1>
        <p className="mt-1 text-sm text-muted">
          {track.label}: {students.length}{" "}
          {students.length === 1 ? "iscritto" : "iscritti"}. Chi segue l&apos;altro corso si vede
          cambiando percorso qui sopra.
        </p>
      </div>

      <AddStudentForm />

      <div className="card p-5">
        {students.length === 0 ? (
          <EmptyState
            icon="🎓"
            title={`Nessuno studente su ${track.label}`}
            description="Aggiungi il primo studente con il modulo qui sopra. Entrerà su questo percorso."
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
