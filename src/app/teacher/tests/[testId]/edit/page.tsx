import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";
import { TestSettingsForm } from "../TestSettingsForm";
import { QuestionList } from "../QuestionList";
import { QuestionForm } from "../QuestionForm";
import { addQuestion } from "../actions";

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

  if (!test || test.createdById !== session.user.id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/teacher/tests" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          &larr; Tutti i test
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{test.title}</h1>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Impostazioni</h2>
        <TestSettingsForm
          test={{
            id: test.id,
            title: test.title,
            description: test.description,
            shuffleQuestions: test.shuffleQuestions,
            timeLimitMinutes: test.timeLimitMinutes,
            maxAttempts: test.maxAttempts,
          }}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Domande ({test.questions.length})
        </h2>
        <QuestionList
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
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Aggiungi domanda</h2>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <QuestionForm testId={test.id} action={addQuestion} submitLabel="Aggiungi domanda" />
        </div>
      </section>
    </div>
  );
}
