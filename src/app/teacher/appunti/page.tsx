import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacherTrack } from "@/lib/track-docente";
import { EmptyState } from "@/components/EmptyState";

import { topicLabel } from "@/lib/topics";
import { togglePublishNote } from "./actions";

/*
 * Gli appunti di ripasso del corso aperto, divisi per materia. Ogni appunto
 * nasce come bozza: gli studenti lo vedono solo quando viene pubblicato qui.
 */
export default async function TeacherAppuntiPage() {
  const { trackId, track } = await requireTeacherTrack();

  const note = await prisma.topicNote.findMany({
    where: { track: trackId },
    orderBy: [{ subject: "asc" }, { topic: "asc" }],
    select: { topic: true, track: true, subject: true, title: true, isPublished: true, updatedAt: true, body: true },
  });

  const pubblicati = note.filter((n) => n.isPublished).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="page-title">Appunti</h1>
        <p className="mt-1 text-sm text-muted">
          {track.label} ·{" "}
          {note.length === 0
            ? "nessun appunto ancora caricato."
            : `${note.length} argomenti, ${pubblicati} pubblicati e ${note.length - pubblicati} in bozza.`}{" "}
          Gli studenti vedono solo quelli pubblicati.
        </p>
      </div>

      {note.length === 0 ? (
        <EmptyState
          icon="📚"
          title={`Nessun appunto su ${track.label}`}
          description="Gli appunti si scrivono come file in content/appunti e si caricano con lo script import-appunti."
        />
      ) : (
        (() => {
          const materie = new Map<string, typeof note>();
          for (const n of note) materie.set(n.subject, [...(materie.get(n.subject) ?? []), n]);

          return (
            <section className="flex flex-col gap-4">
              {[...materie.entries()].map(([materia, elenco]) => (
                <div key={materia} className="flex flex-col gap-2">
                  <h3 className="section-title">{materia}</h3>
                  {elenco.map((n) => (
                    <div key={n.topic} className="card flex flex-wrap items-center justify-between gap-3 p-5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/teacher/appunti/${n.topic}`}
                            className="text-sm font-semibold hover:text-brand-strong"
                          >
                            {topicLabel(n.topic) ?? n.title}
                          </Link>
                          <span
                            className={`pill ${
                              n.isPublished
                                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                : "bg-line text-foreground"
                            }`}
                          >
                            {n.isPublished ? "Pubblicato" : "Bozza"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {n.topic} · {n.body.split(/\s+/).length} parole · aggiornato il{" "}
                          {n.updatedAt.toLocaleDateString("it-IT")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <form action={togglePublishNote}>
                          <input type="hidden" name="topic" value={n.topic} />
                          <button type="submit" className="text-xs font-semibold text-muted hover:text-brand-strong">
                            {n.isPublished ? "Rendi bozza" : "Pubblica"}
                          </button>
                        </form>
                        <Link
                          href={`/teacher/appunti/${n.topic}`}
                          className="text-xs font-semibold text-muted hover:text-brand-strong"
                        >
                          Rivedi
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          );
        })()
      )}
    </div>
  );
}
