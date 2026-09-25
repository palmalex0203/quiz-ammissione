import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";
import { TestSettingsForm } from "../TestSettingsForm";
import { QuestionList } from "../QuestionList";
import { QuestionForm } from "../QuestionForm";
import { addQuestion } from "../actions";
import { trackOf } from "@/lib/tracks";

export default async function EditTestPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  const session = await requireTeacher();

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  const subjects = trackOf(test?.track).subjects.map((s) => s.name);

  if (!test || test.createdById !== session.user.id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/teacher/tests" className="text-sm font-medium text-muted hover:text-brand-strong">
          &larr; Tutti i test
        </Link>
        <h1 className="mt-1 page-title">{test.title}</h1>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="section-title">Impostazioni</h2>
        <TestSettingsForm
          test={{
            id: test.id,
            title: test.title,
            description: test.description,
            shuffleQuestions: test.shuffleQuestions,
            track: test.track,
            timeLimitMinutes: test.timeLimitMinutes,
            maxAttempts: test.maxAttempts,
          }}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="section-title">
          Domande ({test.questions.length})
        </h2>
        <QuestionList
          subjects={subjects}
          testId={test.id}
          questions={test.questions.map((q) => ({
            id: q.id,
            subject: q.subject,
            type: q.type,
            text: q.text,
            order: q.order,
            options: q.options,
          }))}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="section-title">Aggiungi domanda</h2>
        <div className="card p-4">
          <QuestionForm testId={test.id} subjects={subjects} action={addQuestion} submitLabel="Aggiungi domanda" />
        </div>
      </section>
    </div>
  );
}
