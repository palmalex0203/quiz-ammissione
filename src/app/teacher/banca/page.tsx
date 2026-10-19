import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { requireTeacherTrack } from "@/lib/track-docente";
import { poolCounts } from "@/lib/question-pool";
import { publishedNoteTopics } from "@/lib/notes";
import { lezioniPubblicate } from "@/lib/lezioni";
import { TOPICS_BY_TRACK, MIN_TOPIC_QUESTIONS } from "@/lib/topics";
import { iconaMateria } from "@/lib/appunti-materie";

/*
 * La banca domande vista per argomento — e accanto, per ogni argomento, se c'è
 * l'appunto e se c'è la lezione.
 *
 * È la pagina che mancava: lo studente apre «Esercitati» e vede materia per
 * materia quanti argomenti ci sono e quante domande per ciascuno, mentre
 * l'insegnante non aveva nessun modo di guardare la stessa cosa. Chi prepara il
 * corso ha bisogno del contrario di quello che serve allo studente: non "su
 * cosa posso allenarmi", ma "dove siamo scoperti".
 *
 * Per questo le tre colonne sono messe insieme. Un argomento con zero domande,
 * nessun appunto e nessuna lezione è un buco nel programma, e finché i tre dati
 * stavano in tre pagine diverse nessuno lo vedeva.
 */
export default async function TeacherBancaPage({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string }>;
}) {
  const { materia } = await searchParams;
  const { trackId, track } = await requireTeacherTrack();

  const [pool, conAppunto, lezioni] = await Promise.all([
    poolCounts(trackId),
    publishedNoteTopics(trackId),
    lezioniPubblicate(trackId),
  ]);

  const appunti = new Set(conAppunto);
  const lezioniPerArgomento = new Map<string, number>();
  for (const l of lezioni) {
    if (l.topic) lezioniPerArgomento.set(l.topic, (lezioniPerArgomento.get(l.topic) ?? 0) + 1);
  }

  const perMateria = TOPICS_BY_TRACK[trackId];
  const materie = Object.keys(perMateria);
  const aperta = materia && materie.includes(materia) ? materia : null;

  if (pool.total === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Intestazione etichetta={track.label} totale={0} />
        <EmptyState
          icon="🗂️"
          title={`La banca di ${track.label} è vuota`}
          description="Le domande si caricano con gli script di importazione. Finché la banca è vuota, gli studenti non possono allenarsi per argomento."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Intestazione etichetta={track.label} totale={pool.total} />

      {/* Le materie come riquadri, e la materia aperta si sceglie
          dall'indirizzo: nessun interruttore da ricordare, e il collegamento a
          una materia si può mandare a un collega. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {materie.map((m) => {
          const n = pool.bySubject.get(m) ?? 0;
          const attiva = aperta === m;
          return (
            <Link
              key={m}
              href={attiva ? "/teacher/banca" : `/teacher/banca?materia=${encodeURIComponent(m)}`}
              aria-current={attiva ? "true" : undefined}
              className={`card card-link flex flex-col gap-1 p-4 ${attiva ? "border-brand bg-brand-tint" : ""}`}
            >
              <span aria-hidden className="text-xl">
                {iconaMateria(m)}
              </span>
              <span className="text-sm font-semibold leading-snug">{m}</span>
              <span className="text-xs text-muted">
                {n} {n === 1 ? "domanda" : "domande"} · {perMateria[m].length} argomenti
              </span>
            </Link>
          );
        })}
      </div>

      {aperta ? (
        <Argomenti
          materia={aperta}
          argomenti={perMateria[aperta]}
          pool={pool.byTopic}
          appunti={appunti}
          lezioni={lezioniPerArgomento}
        />
      ) : (
        <p className="text-sm text-muted">Tocca una materia per vederne gli argomenti.</p>
      )}
    </div>
  );
}

function Intestazione({ etichetta, totale }: { etichetta: string; totale: number }) {
  return (
    <div>
      <h1 className="page-title">Banca domande</h1>
      <p className="mt-1 text-sm text-muted">
        {etichetta} · {totale} domande in tutto. È quello che gli studenti trovano in Esercitati:
        qui si vede materia per materia, argomento per argomento.
      </p>
    </div>
  );
}

function Argomenti({
  materia,
  argomenti,
  pool,
  appunti,
  lezioni,
}: {
  materia: string;
  argomenti: { code: string; label: string }[];
  pool: Map<string, number>;
  appunti: Set<string>;
  lezioni: Map<string, number>;
}) {
  const scoperti = argomenti.filter((a) => (pool.get(a.code) ?? 0) < MIN_TOPIC_QUESTIONS).length;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="section-title">{materia}</h2>
        <p className="mt-0.5 text-sm text-muted">
          {scoperti === 0
            ? `Tutti gli argomenti hanno almeno ${MIN_TOPIC_QUESTIONS} domande: lo studente può allenarsi su ciascuno.`
            : `${scoperti} ${scoperti === 1 ? "argomento è sotto" : "argomenti sono sotto"} le ${MIN_TOPIC_QUESTIONS} domande: lì il pulsante «allenati» allo studente non compare.`}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {argomenti.map((a) => {
          const domande = pool.get(a.code) ?? 0;
          const quanteLezioni = lezioni.get(a.code) ?? 0;
          const esercitabile = domande >= MIN_TOPIC_QUESTIONS;

          return (
            <li
              key={a.code}
              className={`card flex flex-wrap items-center justify-between gap-3 p-4 ${
                esercitabile ? "" : "border-amber-300 dark:border-amber-700/60"
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{a.label}</p>
                <p className="mt-0.5 text-xs text-muted">{a.code}</p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                <span
                  className={`pill ${
                    esercitabile
                      ? "bg-brand-soft text-brand-strong"
                      : "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
                  }`}
                >
                  <span className="tabular-nums">{domande}</span>{" "}
                  {domande === 1 ? "domanda" : "domande"}
                </span>

                {appunti.has(a.code) ? (
                  <Link href={`/teacher/appunti/${a.code}`} className="pill bg-line hover:text-brand-strong">
                    📖 appunto
                  </Link>
                ) : (
                  <span className="pill text-muted">senza appunto</span>
                )}

                {quanteLezioni > 0 && (
                  <span className="pill bg-line">
                    🎥 {quanteLezioni} {quanteLezioni === 1 ? "lezione" : "lezioni"}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
