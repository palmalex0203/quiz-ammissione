import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";
import { EmptyState } from "@/components/EmptyState";
import { ALL_TRACKS, trackOf } from "@/lib/tracks";
import { topicLabel } from "@/lib/topics";
import { togglePublishNote } from "./actions";

/*
 * Elenco degli appunti di ripasso, divisi per percorso e materia. Ogni appunto
 * nasce come bozza: gli studenti lo vedono solo quando viene pubblicato qui.
 */
export default async function TeacherAppuntiPage() {
  await requireTeacher();

  const note = await prisma.topicNote.findMany({
    orderBy: [{ track: "asc" }, { subject: "asc" }, { topic: "asc" }],
    select: { topic: true, track: true, subject: true, title: true, isPublished: true, updatedAt: true, body: true },
  });

  const pubblicati = note.filter((n) => n.isPublished).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="page-title">Appunti</h1>
        <p className="text-sm text-muted">
          {note.length === 0
            ? "Nessun appunto ancora caricato."
            : `${note.length} argomenti · ${pubblicati} pubblicati, ${note.length - pubblicati} in bozza.`}{" "}
          Gli studenti vedono solo quelli pubblicati, dalla scheda della materia in Esercitati.
        </p>
      </div>

      {note.length === 0 ? (
        <EmptyState
          icon="📚"
          title="Nessun appunto"
          description="Gli appunti si scrivono come file in content/appunti e si caricano con lo script import-appunti."
        />
      ) : (
        ALL_TRACKS.map((track) => {
          const delPercorso = note.filter((n) => trackOf(n.track).id === track.id);
          if (delPercorso.length === 0) return null;

          const materie = new Map<string, typeof delPercorso>();
          for (const n of delPercorso) materie.set(n.subject, [...(materie.get(n.subject) ?? []), n]);

          return (
            <section key={track.id} className="flex flex-col gap-4">
              <div className="flex items-baseline gap-2 border-b border-line pb-2">
                <h2 className="font-display text-xl font-bold tracking-tight">{track.label}</h2>
                <span className="text-xs text-muted">{delPercorso.length} argomenti</span>
              </div>

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
                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
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
        })
      )}
    </div>
  );
}
