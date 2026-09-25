"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/permissions";
import { isTrackId } from "@/lib/tracks";
import { TRACK_COOKIE } from "@/lib/track-session";

// Un anno: la scelta del percorso non è un dato riservato e non deve scadere
// durante la preparazione.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function switchTrack(formData: FormData): Promise<void> {
  const session = await requireStudent();

  const track = String(formData.get("track") ?? "");
  if (!isTrackId(track)) throw new Error("Percorso non valido.");

  (await cookies()).set(TRACK_COOKIE, track, {
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
    path: "/",
  });
  await prisma.user.update({ where: { id: session.user.id }, data: { track } });

  revalidatePath("/student", "layout");
  redirect("/student/dashboard");
}
