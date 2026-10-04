import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { seededShuffle } from "@/lib/shuffle";
import { testQuestions } from "@/lib/test-questions";
import { inizioSezione, sezioneAperta, sezioniDi } from "@/lib/test-sections";
import { trackOf } from "@/lib/tracks";
import { TakeTestForm } from "./TakeTestForm";

export default async function TakeTestPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  const session = await requireStudent();

  const attempt = await prisma.attempt.findFirst({
    where: { testId, studentId: session.user.id, status: "IN_PROGRESS" },
  });

  if (!attempt) {
    redirect("/student/dashboard");
  }

  const [test, domande, existingAnswers] = await Promise.all([
    prisma.test.findUnique({ where: { id: testId } }),
    testQuestions(testId),
    prisma.answerRecord.findMany({ where: { attemptId: attempt.id } }),
  ]);

  if (!test) notFound();
  const initialAnswers = Object.fromEntries(
    existingAnswers
      .filter((a) => a.selectedOptionId)
      .map((a) => [a.questionId, a.selectedOptionId as string])
  );
  // Le risposte scritte (domande a completamento) viaggiano a parte.
  const initialTyped = Object.fromEntries(
    existingAnswers.filter((a) => a.typedAnswer).map((a) => [a.questionId, a.typedAnswer as string])
  );

  // Le sezioni si ricavano dall'ordine vero delle domande, prima di qualunque
  // mescolamento: sono blocchi di materia, e mescolare l'intero test li scioglierebbe.
  const sezioni = sezioniDi(trackOf(test.track), domande, test.timeLimitMinutes);
  const corrente = sezioneAperta(sezioni, attempt.sezione);
  const aSezioni = sezioni.length > 1;

  const diQuestaSezione = corrente ? new Set(corrente.domande) : null;
  const visibili = diQuestaSezione ? domande.filter((q) => diQuestaSezione.has(q.id)) : domande;
  // Il mescolamento resta dentro la sezione, dove l'ordine delle domande non conta.
  const questions = test.shuffleQuestions ? seededShuffle(visibili, attempt.id) : visibili;

  return (
    <TakeTestForm
      testTitle={test.title}
      attemptId={attempt.id}
      timeLimitMinutes={aSezioni ? (corrente?.minutes ?? null) : test.timeLimitMinutes}
      startedAt={inizioSezione(attempt).toISOString()}
      // La numerazione segue il fascicolo: nella seconda materia si riparte da 1,
      // perché all'esame ogni prova ha la sua numerazione.
      questions={questions.map((q) => ({
        id: q.id,
        type: q.type,
        subject: q.subject,
        text: q.text,
        // Al browser non si manda quale opzione è giusta. Nelle domande a
        // completamento le "opzioni" sono le risposte ammesse: non si mandano affatto.
        options: q.type === "COMPLETAMENTO" ? [] : q.options.map((o) => ({ id: o.id, text: o.text })),
      }))}
      initialAnswers={initialAnswers}
      initialTyped={initialTyped}
      sezioni={
        aSezioni
          ? sezioni.map((s) => ({ subject: s.subject, domande: s.domande.length, minutes: s.minutes }))
          : null
      }
      sezioneCorrente={attempt.sezione}
    />
  );
}
