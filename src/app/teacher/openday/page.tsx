import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/EmptyState";
import { EVENTO } from "@/lib/open-day-evento";
import { requireTeacherTrack } from "@/lib/track-docente";
import { TRACKS } from "@/lib/tracks";

/*
 * I contatti raccolti dalla pagina pubblica dell'open day.
 *
 * Senza questa pagina i dati esistono ma non li vede nessuno: finirebbero in
 * una tabella che si apre solo dal database, e la sera dell'open day servono
 * qui. Chi ha abbandonato la simulazione a metà è in elenco come gli altri, e
 * segnalato: è il contatto da richiamare per primo, perché ha provato ed è
 * rimasto a bocca asciutta.
 *
 * Non va in cache: è una pagina che si apre di rado, da una persona sola, e
 * quando la si apre si vuole il dato di adesso.
 */

type Stato = { etichetta: string; classe: string };

function statoDi(l: { postoDiretta: boolean; simulazioneIniziataIl: Date | null; completataIl: Date | null }): Stato[] {
  const stati: Stato[] = [];

  if (l.postoDiretta) {
    stati.push({
      etichetta: "Iscritto alla diretta",
      classe: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    });
  }
  if (l.completataIl) {
    stati.push({ etichetta: "Simulazione finita", classe: "pill-brand" });
  } else if (l.simulazioneIniziataIl) {
    stati.push({
      etichetta: "Simulazione lasciata a metà",
      classe: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
    });
  }
  if (stati.length === 0) {
    stati.push({ etichetta: "Solo contatto", classe: "bg-line text-foreground" });
  }
  return stati;
}

export default async function TeacherOpenDayPage() {
  const { trackId, track } = await requireTeacherTrack();

  // I contatti portano il percorso con cui sono entrati. Oggi l'open day è
  // un evento del semestre filtro soltanto, quindi sull'altro corso questa
  // pagina è vuota — e lo dice, invece di far sospettare che i dati siano
  // andati persi.
  const contatti = await prisma.lead.findMany({
    where: { percorso: trackId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nome: true,
      email: true,
      telefono: true,
      createdAt: true,
      postoDiretta: true,
      simulazioneIniziataIl: true,
      completataIl: true,
      punteggio: true,
      utmSource: true,
      utmCampaign: true,
    },
  });

  const iscritti = contatti.filter((c) => c.postoDiretta).length;
  const iniziate = contatti.filter((c) => c.simulazioneIniziataIl).length;
  const finite = contatti.filter((c) => c.completataIl).length;

  const numeri = [
    { etichetta: "Contatti", valore: contatti.length },
    { etichetta: "Iscritti alla diretta", valore: iscritti },
    { etichetta: "Simulazioni iniziate", valore: iniziate },
    { etichetta: "Finite", valore: finite },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Open day</h1>
          <p className="mt-1 text-sm text-muted">
            {track.label} — i contatti lasciati sulla pagina pubblica. {EVENTO.postiTotali} posti in
            tutto, ne restano {Math.max(0, EVENTO.postiTotali - iscritti)}.
          </p>
        </div>
        {contatti.length > 0 && (
          <a href="/teacher/openday/csv" className="btn btn-soft" download>
            Scarica in CSV
          </a>
        )}
      </div>

      {contatti.length === 0 ? (
        <EmptyState
          icon="📋"
          title={`Nessun contatto su ${track.label}`}
          description={
            trackId === "SEMESTRE_FILTRO"
              ? "Qui compaiono le persone che lasciano i dati sulla pagina dell'open day, comprese quelle che iniziano la simulazione e non la finiscono."
              : `L'open day è un evento di ${TRACKS.SEMESTRE_FILTRO.label}: i contatti si vedono cambiando percorso qui sopra.`
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {numeri.map((n) => (
              <div key={n.etichetta} className="card p-4">
                <p className="font-display text-3xl font-bold tabular-nums">{n.valore}</p>
                <p className="mt-0.5 text-xs text-muted">{n.etichetta}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {contatti.map((c) => (
              <div key={c.id} className="card flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="font-semibold">{c.nome}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    <a href={`mailto:${c.email}`} className="hover:text-brand-strong">
                      {c.email}
                    </a>
                    {c.telefono && (
                      <>
                        {" · "}
                        <a href={`tel:${c.telefono}`} className="hover:text-brand-strong">
                          {c.telefono}
                        </a>
                      </>
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {statoDi(c).map((s) => (
                      <span key={s.etichetta} className={`pill ${s.classe}`}>
                        {s.etichetta}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 text-right text-xs text-muted">
                  <p>{c.createdAt.toLocaleDateString("it-IT")}</p>
                  {c.punteggio !== null && (
                    <p className="mt-0.5 tabular-nums">{c.punteggio.toLocaleString("it-IT")} punti su 93</p>
                  )}
                  {c.utmSource && (
                    <p className="mt-0.5">
                      da {c.utmSource}
                      {c.utmCampaign && ` · ${c.utmCampaign}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
