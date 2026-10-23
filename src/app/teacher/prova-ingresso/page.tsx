import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/EmptyState";
import { requireTeacherTrack } from "@/lib/track-docente";
import { fascia, TOTALE, type Esito } from "@/lib/prova-ingresso";

/*
 * Gli esiti del test di valutazione iniziale.
 *
 * Due letture, in quest'ordine: prima come sta la classe — perché è su quella
 * che si decide da dove partire a lezione — e poi chi ha fatto che cosa. Il
 * contrario costringerebbe a fare la media a mente leggendo venti righe.
 *
 * L'esito per materia e per argomento è già calcolato alla consegna e sta nel
 * campo JSON: qui non si ricorregge niente, si somma.
 */
export const dynamic = "force-dynamic";

type Riga = {
  id: string;
  nome: string;
  cognome: string;
  createdAt: Date;
  completataIl: Date | null;
  punti: number | null;
  esito: Esito | null;
};

export default async function ProvaIngressoDocentePage() {
  const { trackId, track } = await requireTeacherTrack();

  // Il test esiste per il semestre filtro: le sue materie sono quelle.
  if (trackId !== "SEMESTRE_FILTRO") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="page-title">Test di valutazione iniziale</h1>
          <p className="mt-1 text-sm text-muted">{track.label}</p>
        </div>
        <EmptyState
          icon="🎯"
          title="Il test d'ingresso è del semestre filtro"
          description="Passa a Semestre filtro dal selettore in alto per vederne gli esiti. Per Professioni Sanitarie non ne abbiamo ancora preparato uno."
        />
      </div>
    );
  }

  const righe = (await prisma.provaIngresso.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nome: true,
      cognome: true,
      createdAt: true,
      completataIl: true,
      punti: true,
      esito: true,
    },
  })) as unknown as Riga[];

  const fatte = righe.filter((r) => r.completataIl && r.esito);
  const lasciate = righe.length - fatte.length;

  // La classe materia per materia: media delle risposte giuste su 15.
  const materie = new Map<string, { short: string; giuste: number; domande: number }>();
  // E argomento per argomento, che è il dato che dice su che cosa insistere.
  const argomenti = new Map<string, { etichetta: string; giuste: number; domande: number }>();

  for (const r of fatte) {
    for (const m of r.esito!.materie) {
      const v = materie.get(m.subject) ?? { short: m.short, giuste: 0, domande: 0 };
      v.giuste += m.giuste;
      v.domande += m.domande;
      materie.set(m.subject, v);
    }
    for (const a of r.esito!.argomenti) {
      const v = argomenti.get(a.topic) ?? { etichetta: a.etichetta, giuste: 0, domande: 0 };
      v.giuste += a.giuste;
      v.domande += a.domande;
      argomenti.set(a.topic, v);
    }
  }

  const deboli = [...argomenti.entries()]
    .map(([topic, v]) => ({ topic, ...v, pct: Math.round((v.giuste / Math.max(1, v.domande)) * 100) }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 6);

  const mediaPunti =
    fatte.length > 0
      ? Math.round((fatte.reduce((n, r) => n + (r.punti ?? 0), 0) / fatte.length) * 10) / 10
      : 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="page-title">Test di valutazione iniziale</h1>
        <p className="mt-1 text-sm text-muted">
          {track.label} · {TOTALE} domande sui prerequisiti, da fare senza account prima della prima
          lezione. Il collegamento da passare alla classe è{" "}
          <span className="font-medium text-foreground">/prova-ingresso</span>.
        </p>
      </div>

      {righe.length === 0 ? (
        <EmptyState
          icon="📝"
          title="Nessuno l'ha ancora fatto"
          description="Appena qualcuno consegna, qui compaiono il punteggio di ciascuno e il quadro della classe materia per materia."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Tessera etichetta="Consegnati" valore={String(fatte.length)} />
            <Tessera etichetta="Lasciati a metà" valore={String(lasciate)} />
            <Tessera etichetta="Media" valore={`${mediaPunti.toLocaleString("it-IT")}/${TOTALE}`} />
            <Tessera
              etichetta="Materia più debole"
              valore={
                materie.size > 0
                  ? [...materie.values()].sort(
                      (a, b) => a.giuste / Math.max(1, a.domande) - b.giuste / Math.max(1, b.domande)
                    )[0].short
                  : "—"
              }
            />
          </div>

          {materie.size > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="section-title">Come sta la classe</h2>
              <div className="card flex flex-col gap-4 p-5">
                {[...materie.entries()].map(([subject, v]) => {
                  const pct = Math.round((v.giuste / Math.max(1, v.domande)) * 100);
                  const media = v.giuste / Math.max(1, fatte.length);
                  return (
                    <div key={subject} className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium">{v.short}</span>
                        <span className="shrink-0 text-xs tabular-nums text-muted">
                          {media.toFixed(1)} risposte giuste su 15 di media · {pct}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-line">
                        <div
                          className={`h-full rounded-full ${
                            pct >= 80 ? "bg-green-500" : pct >= 53 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {deboli.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="section-title">Da riprendere per primi</h2>
              <p className="-mt-1 text-sm text-muted">
                Le unità del syllabus dove la classe sbaglia di più, su tutte le prove consegnate.
              </p>
              <div className="card divide-y divide-line">
                {deboli.map((a) => (
                  <div key={a.topic} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.etichetta}</p>
                      <p className="text-xs text-muted">{a.topic}</p>
                    </div>
                    <span
                      className={`pill shrink-0 ${
                        a.pct >= 80
                          ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
                          : a.pct >= 53
                            ? "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
                            : "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
                      }`}
                    >
                      {a.pct}% giuste
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <h2 className="section-title">Chi l&apos;ha fatto</h2>
            <div className="card divide-y divide-line">
              {righe.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {r.cognome} {r.nome}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {(r.completataIl ?? r.createdAt).toLocaleString("it-IT")}
                      {!r.completataIl && " · non consegnato"}
                    </p>
                  </div>

                  {r.completataIl && r.esito ? (
                    <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0 sm:justify-end">
                      {r.esito.materie.map((m) => {
                        const f = fascia(m.giuste);
                        return (
                          <span
                            key={m.subject}
                            title={`${m.short}: ${f.testo}`}
                            className={`pill ${
                              f.tono === "verde"
                                ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
                                : f.tono === "ambra"
                                  ? "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
                            }`}
                          >
                            {m.short} {m.giuste}/{m.domande}
                          </span>
                        );
                      })}
                      <span className="pill bg-ink text-on-ink">
                        {(r.punti ?? 0).toLocaleString("it-IT")}/{TOTALE}
                      </span>
                    </div>
                  ) : (
                    <span className="pill shrink-0 bg-line text-muted">lasciato a metà</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Tessera({ etichetta, valore }: { etichetta: string; valore: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-muted">{etichetta}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums">{valore}</p>
    </div>
  );
}
