import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudentTrack } from "@/lib/track-session";
import { SubmitButton } from "@/components/SubmitButton";
import { renderMarkdown } from "@/lib/markdown";
import { topicLabel, MIN_TOPIC_QUESTIONS } from "@/lib/topics";
import { poolCounts } from "@/lib/question-pool";
import { generateTopicPractice } from "@/app/student/dashboard/actions";

/*
 * L'appunto di ripasso di un argomento. In fondo c'è il pulsante per allenarsi
 * subito sullo stesso argomento: leggere e poi provare è il motivo per cui questa
 * pagina sta dentro l'app invece che in un file a parte.
 */
export default async function StudentNotePage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const { track } = await requireStudentTrack();

  const [nota, pool] = await Promise.all([
    prisma.topicNote.findUnique({ where: { topic } }),
    poolCounts(track.id),
  ]);

  // Una bozza, o un appunto di un altro percorso, per lo studente non esiste.
  if (!nota || !nota.isPublished || nota.track !== track.id) notFound();

  const domande = pool.byTopic.get(topic) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/student/practice?materia=${encodeURIComponent(nota.subject)}`}
          className="text-sm font-medium text-muted hover:text-brand-strong"
        >
          &larr; {nota.subject}
        </Link>
        <h1 className="page-title mt-2">{topicLabel(nota.topic) ?? nota.title}</h1>
        <p className="mt-1 text-sm text-muted">
          Appunto di ripasso · {nota.subject} · aggiornato il {nota.updatedAt.toLocaleDateString("it-IT")}
        </p>
      </div>

      <article className="card prose p-6 sm:p-8" dangerouslySetInnerHTML={{ __html: renderMarkdown(nota.body) }} />

      {domande >= MIN_TOPIC_QUESTIONS && (
        <div className="flex flex-col justify-between gap-3 rounded-3xl bg-brand p-6 text-white sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg font-bold">Ora provaci</p>
            <p className="mt-0.5 text-sm text-white/90">
              {domande} domande su questo argomento, pescate a caso: il modo più rapido per capire se è entrato.
            </p>
          </div>
          <form action={generateTopicPractice}>
            <input type="hidden" name="topic" value={nota.topic} />
            <SubmitButton pendingText="Preparo l'esercitazione…" className="btn btn-on-brand w-full sm:w-auto">
              Allenati su questo argomento
            </SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
