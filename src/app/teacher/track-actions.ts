"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";
import { isTrackId } from "@/lib/tracks";
import { TRACK_COOKIE_DOCENTE } from "@/lib/track-docente";

// Un anno: su quale corso si sta lavorando non è un dato riservato e non deve
// scadere nel mezzo dell'anno scolastico.
const DURATA_COOKIE = 60 * 60 * 24 * 365;

export async function cambiaPercorsoDocente(formData: FormData): Promise<void> {
  const session = await requireTeacher();

  const track = String(formData.get("track") ?? "");
  if (!isTrackId(track)) throw new Error("Percorso non valido.");

  (await cookies()).set(TRACK_COOKIE_DOCENTE, track, {
    maxAge: DURATA_COOKIE,
    sameSite: "lax",
    path: "/",
  });
  await prisma.user.update({ where: { id: session.user.id }, data: { track } });

  revalidatePath("/teacher", "layout");
  // Si torna al cruscotto e non si resta dov'eravamo: una pagina di dettaglio
  // — il risultato di uno studente, un test — parla di roba dell'altro corso,
  // e dopo il cambio non avrebbe più senso.
  redirect("/teacher/dashboard");
}
