import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";
import { DEFAULT_TRACK, isTrackId, TRACKS, type Track, type TrackId } from "@/lib/tracks";

/*
 * Il percorso su cui l'insegnante sta lavorando.
 *
 * I due corsi hanno banche dati, materie, struttura di prova e punteggi
 * diversi: un elenco che li mescola non è una comodità, è un posto dove si
 * sbaglia. Un trenta del semestre filtro accanto a un punteggio di professioni
 * sanitarie non si confronta, e una media che li somma non vuol dire niente.
 *
 * Funziona come la scelta dello studente (src/lib/track-session.ts): sta su un
 * cookie perché ogni pagina possa leggerla senza una query, e sul profilo
 * perché duri cambiando dispositivo. Il cookie è però un altro — `percorso` è
 * dello studente — così sullo stesso browser le due scelte non si pestano i
 * piedi.
 */
export const TRACK_COOKIE_DOCENTE = "percorso-docente";

// cache(): la struttura della pagina e la pagina stessa lo chiedono nella
// stessa richiesta, e senza cookie sarebbe una query a testa.
export const trackDocenteId = cache(async (userId: string): Promise<TrackId> => {
  const daCookie = (await cookies()).get(TRACK_COOKIE_DOCENTE)?.value;
  if (isTrackId(daCookie)) return daCookie;

  const u = await prisma.user.findUnique({ where: { id: userId }, select: { track: true } });
  return isTrackId(u?.track) ? u.track : DEFAULT_TRACK;
});

/** Quello che serve a ogni pagina dell'insegnante: chi è e su che corso sta. */
export async function requireTeacherTrack(): Promise<{
  session: Awaited<ReturnType<typeof requireTeacher>>;
  trackId: TrackId;
  track: Track;
}> {
  const session = await requireTeacher();
  const trackId = await trackDocenteId(session.user.id);
  return { session, trackId, track: TRACKS[trackId] };
}
