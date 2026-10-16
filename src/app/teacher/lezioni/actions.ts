"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/permissions";
import { requireTeacherTrack } from "@/lib/track-docente";
import { LEZIONI_TAG, leggiVideo, urlDirettaValido } from "@/lib/lezioni";
import { isKnownTopic, topicSubject, topicTrack } from "@/lib/topics";

/*
 * Le lezioni dall'area insegnante.
 *
 * Fino a ieri si caricavano solo con uno script dal terminale, il che vuol dire
 * che le caricava una persona sola e solo dal suo computer. Una lezione in
 * diretta però si pubblica il giorno stesso, magari da un telefono, e chi la
 * tiene non apre un terminale.
 *
 * Ogni scrittura svuota la cache delle lezioni: gli studenti le leggono da lì,
 * e senza questo una lezione pubblicata resterebbe invisibile fino a un'ora.
 */

export type StatoLezione = { errore?: string; creata?: string };

/** Avvisa il sito che le lezioni sono cambiate. */
function cacheDaRifare(trackId: string) {
  updateTag(LEZIONI_TAG);
  revalidatePath("/teacher/lezioni");
  revalidatePath("/student/lezioni");
  void trackId;
}

export async function creaLezione(_prec: StatoLezione, formData: FormData): Promise<StatoLezione> {
  const { trackId } = await requireTeacherTrack();

  const titolo = String(formData.get("titolo") ?? "").trim();
  const descrizione = String(formData.get("descrizione") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "");
  const indirizzo = String(formData.get("indirizzo") ?? "").trim();
  const quando = String(formData.get("quando") ?? "");
  const durataGrezza = String(formData.get("durataMinuti") ?? "").trim();
  const argomento = String(formData.get("argomento") ?? "").trim();

  if (!titolo) return { errore: "Il titolo è obbligatorio." };
  if (!indirizzo) {
    return {
      errore:
        tipo === "diretta"
          ? "Manca l'indirizzo della riunione."
          : "Manca l'indirizzo del video.",
    };
  }

  const data = quando ? new Date(quando) : null;
  if (!data || Number.isNaN(data.getTime())) return { errore: "La data non è valida." };

  const durataMinuti = durataGrezza ? Number(durataGrezza) : null;
  if (durataMinuti !== null && (!Number.isFinite(durataMinuti) || durataMinuti <= 0)) {
    return { errore: "La durata dev'essere un numero di minuti." };
  }

  // L'argomento decide anche la materia: sono legati, e chiederli due volte
  // vuol dire poterli contraddire.
  let subject: string | null = null;
  if (argomento) {
    if (!isKnownTopic(argomento)) return { errore: "Argomento sconosciuto." };
    if (topicTrack(argomento) !== trackId) {
      return { errore: "Quell'argomento è dell'altro percorso." };
    }
    subject = topicSubject(argomento) ?? null;
  }

  let fornitore: string | null = null;
  let videoId: string | null = null;
  let urlDiretta: string | null = null;

  if (tipo === "diretta") {
    urlDiretta = urlDirettaValido(indirizzo);
    if (!urlDiretta) {
      return {
        errore: "L'indirizzo dev'essere una riunione Teams, Meet o Zoom, in https.",
      };
    }
  } else {
    const video = leggiVideo(indirizzo);
    if (!video) return { errore: "Non riconosco l'indirizzo: serve YouTube o Vimeo." };
    fornitore = video.fornitore;
    videoId = video.videoId;
  }

  // Nasce come bozza: si pubblica con un clic, dopo averla riletta. Una lezione
  // pubblicata per sbaglio la vede subito tutta la classe.
  await prisma.lezione.create({
    data: {
      titolo,
      descrizione: descrizione || null,
      track: trackId,
      subject,
      topic: argomento || null,
      data,
      durataMinuti,
      fornitore,
      videoId,
      urlDiretta,
      isPublished: false,
    },
  });

  cacheDaRifare(trackId);
  return { creata: titolo };
}

export async function cambiaPubblicazioneLezione(formData: FormData): Promise<void> {
  const { trackId } = await requireTeacherTrack();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Si cerca anche per percorso: così da una pagina del corso aperto non si può
  // toccare, nemmeno di proposito, una lezione dell'altro.
  const lezione = await prisma.lezione.findFirst({
    where: { id, track: trackId },
    select: { id: true, isPublished: true },
  });
  if (!lezione) return;

  await prisma.lezione.update({
    where: { id: lezione.id },
    data: { isPublished: !lezione.isPublished },
  });

  cacheDaRifare(trackId);
}

export async function eliminaLezione(formData: FormData): Promise<void> {
  await requireTeacher();
  const { trackId } = await requireTeacherTrack();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const lezione = await prisma.lezione.findFirst({ where: { id, track: trackId }, select: { id: true } });
  if (!lezione) return;

  await prisma.lezione.delete({ where: { id: lezione.id } });
  cacheDaRifare(trackId);
}
