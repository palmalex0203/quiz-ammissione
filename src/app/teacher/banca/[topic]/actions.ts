"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTeacherTrack } from "@/lib/track-docente";
import { POOL_TAG } from "@/lib/question-pool";
import { leggiRisposte, validaRisposte } from "@/lib/domande";
import { isKnownTopic, topicSubject, topicTrack } from "@/lib/topics";
import { TRACKS, type TrackId } from "@/lib/tracks";

/*
 * Scrivere una domanda direttamente nella banca.
 *
 * Finora le domande entravano solo dagli script di importazione: chi insegna
 * non poteva aggiungerne una senza passare da chi ha il terminale. Ma le
 * domande nascono mentre si fa lezione — da un errore ricorrente, da una
 * domanda di uno studente — e se per scriverle serve un'altra persona non si
 * scrivono.
 */

export type StatoDomanda = { errore?: string; aggiunta?: boolean };

/**
 * Il contenitore della banca per un argomento.
 *
 * La banca non è una tabella sua: è un test di tipo POOL, uno per argomento,
 * da cui le esercitazioni pescano. Se per questo argomento non c'è ancora, si
 * crea seguendo il nome già usato dagli script, così le domande scritte a mano
 * e quelle importate finiscono nello stesso posto.
 */
async function contenitore(trackId: TrackId, topic: string, autoreId: string) {
  const esistente = await prisma.question.findFirst({
    where: { topic, test: { kind: "POOL", track: trackId } },
    select: { testId: true },
  });
  if (esistente) return esistente.testId;

  const materia = topicSubject(topic) ?? "Varie";
  const creato = await prisma.test.create({
    data: {
      title: `Banca ${TRACKS[trackId].label} — ${materia} ${topic}`,
      track: trackId,
      kind: "POOL",
      isPublished: false,
      createdById: autoreId,
    },
    select: { id: true },
  });
  return creato.id;
}

export async function aggiungiDomandaBanca(
  _prec: StatoDomanda,
  formData: FormData
): Promise<StatoDomanda> {
  const { session, trackId } = await requireTeacherTrack();

  const topic = String(formData.get("topic") ?? "");
  if (!isKnownTopic(topic)) return { errore: "Argomento sconosciuto." };
  if (topicTrack(topic) !== trackId) return { errore: "Quell'argomento è dell'altro percorso." };

  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { errore: "Il testo della domanda è obbligatorio." };

  const valida = validaRisposte(
    String(formData.get("type") ?? ""),
    leggiRisposte(String(formData.get("optionsJson") ?? "[]"))
  );
  if (!valida.ok) return { errore: valida.errore };

  // La materia non si chiede: la decide l'argomento. Sono legate, e lasciarle
  // scrivere a mano vuol dire poterle contraddire — e una domanda con la
  // materia sbagliata sparisce dai conteggi di quella giusta.
  const subject = topicSubject(topic);
  if (!subject) return { errore: "Non riesco a risalire alla materia di questo argomento." };

  try {
    const testId = await contenitore(trackId, topic, session.user.id);

    const ultima = await prisma.question.findFirst({
      where: { testId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    await prisma.question.create({
      data: {
        testId,
        subject,
        topic,
        type: valida.tipo,
        text,
        order: (ultima?.order ?? 0) + 1,
        options: {
          create: valida.risposte.map((o, i) => ({
            text: o.text,
            isCorrect: o.isCorrect,
            order: i + 1,
          })),
        },
      },
    });
  } catch (e) {
    console.error("[banca] aggiunta domanda:", e);
    return { errore: "Non siamo riusciti a salvare la domanda. Riprova fra un attimo." };
  }

  // I conteggi della banca stanno in cache: senza questo, la domanda nuova c'è
  // ma per cinque minuti non la conta nessuno — e allo studente l'argomento
  // resta sotto la soglia per allenarsi.
  updateTag(POOL_TAG);
  revalidatePath(`/teacher/banca/${topic}`);
  revalidatePath("/teacher/banca");

  return { aggiunta: true };
}
