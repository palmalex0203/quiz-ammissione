import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";
import { renderMarkdown } from "@/lib/markdown";
import { topicLabel } from "@/lib/topics";
import { trackOf } from "@/lib/tracks";
import { NoteEditor } from "./NoteEditor";
import { togglePublishNote } from "../actions";

export default async function TeacherNotePage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  await requireTeacher();

  const nota = await prisma.topicNote.findUnique({ where: { topic } });
  if (!nota) notFound();

  const track = trackOf(nota.track);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/teacher/appunti" className="text-sm font-medium text-muted hover:text-brand-strong">
          &larr; Tutti gli appunti
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="page-title">{topicLabel(nota.topic) ?? nota.title}</h1>
          <span
            className={`pill ${
              nota.isPublished
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {nota.isPublished ? "Pubblicato" : "Bozza"}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {track.label} · {nota.subject} · argomento {nota.topic}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-brand/25 bg-brand-tint p-5">
        <div>
          <p className="text-sm font-semibold">
            {nota.isPublished ? "Gli studenti lo stanno leggendo" : "Gli studenti non lo vedono ancora"}
          </p>
          <p className="text-xs text-muted">
            {nota.isPublished
              ? "Compare in Esercitati, accanto all'argomento."
              : "Pubblicalo quando l'hai riletto: finché è in bozza resta visibile solo a te."}
          </p>
        </div>
        <form action={togglePublishNote}>
          <input type="hidden" name="topic" value={nota.topic} />
          <button type="submit" className={`btn ${nota.isPublished ? "btn-soft" : "btn-brand"}`}>
            {nota.isPublished ? "Riporta in bozza" : "Pubblica per gli studenti"}
          </button>
        </form>
      </div>

      {nota.reviewNotes && (
        <section className="card border-amber-300/60 bg-amber-50/70 p-6 dark:border-amber-500/30 dark:bg-amber-500/10">
          <h2 className="section-title">Da controllare prima di pubblicare</h2>
          <p className="mt-1 text-xs text-muted">
            Solo per te: gli studenti non vedono questa parte. Sono i punti su cui l&apos;appunto va verificato,
            e i dati che non vengono dalle slide del corso.
          </p>
          <div
            className="prose mt-4 text-sm"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(nota.reviewNotes) }}
          />
        </section>
      )}

      <NoteEditor topic={nota.topic} title={nota.title} body={nota.body} />

      <section className="flex flex-col gap-3">
        <h2 className="section-title">Anteprima</h2>
        <article
          className="card prose p-6 sm:p-8"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(nota.body) }}
        />
      </section>
    </div>
  );
}
