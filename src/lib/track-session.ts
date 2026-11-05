import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireStudent } from "@/lib/permissions";
import { DEFAULT_TRACK, isTrackId, TRACKS, type Track, type TrackId } from "@/lib/tracks";

/*
 * Il percorso scelto dallo studente. La scelta viene salvata sul suo profilo
 * (User.track) perché duri nel tempo e su un cookie perché ogni pagina possa
 * leggerla senza interrogare il database: le pagine dello studente ne aprono già
 * diverse di query, e il piano del database conta le righe esaminate.
 */
export const TRACK_COOKIE = "percorso";

// cache(): layout e pagina chiedono il percorso nella stessa richiesta, e senza
// cookie servirebbe una query a testa.
export const currentTrackId = cache(async (userId: string): Promise<TrackId> => {
  // Uno studente bloccato su un percorso vede solo quello, qualunque cookie abbia:
  // il blocco viaggia nel token di accesso, quindi non costa una query.
  const locked = await lockedTrackId();
  if (locked) return locked;

  const fromCookie = (await cookies()).get(TRACK_COOKIE)?.value;
  if (isTrackId(fromCookie)) return fromCookie;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { track: true } });
  return isTrackId(user?.track) ? user.track : DEFAULT_TRACK;
});

// Il percorso a cui lo studente è bloccato, o null se può scegliere.
export const lockedTrackId = cache(async (): Promise<TrackId | null> => {
  const locked = (await auth())?.user.lockedTrack;
  return isTrackId(locked) ? locked : null;
});

export async function currentTrack(userId: string): Promise<Track> {
  return TRACKS[await currentTrackId(userId)];
}

// Quello che serve a ogni pagina dello studente: chi è e su quale percorso sta
// lavorando.
export async function requireStudentTrack() {
  const session = await requireStudent();
  const track = await currentTrack(session.user.id);
  return { session, track };
}
