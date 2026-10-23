"use server";

/**
 * Le scritture della pagina pubblica del test di valutazione iniziale.
 *
 * Come per l'open day: la riga si scrive **quando la prova comincia**, non alla
 * consegna. Chi si ferma a metà resta negli elenchi del docente con la prova
 * incompleta, che è un'informazione — significa che non ci stava dentro col
 * tempo, o che si è arreso.
 *
 * Attenzione: queste funzioni si raggiungono con una POST diretta, non solo dai
 * moduli della pagina, e qui non c'è nessun login a fare da filtro — la pagina è
 * pubblica apposta, perché il primo giorno gli studenti un account non ce l'hanno.
 * Quindi ogni campo si convalida e si tronca.
 */

import { prisma } from "@/lib/prisma";
import { correggi, type Esito, type RispostaData, TOTALE } from "@/lib/prova-ingresso";

const MAX_NOME = 60;

function pulisci(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().replace(/\s+/g, " ").slice(0, MAX_NOME);
  return t.length > 0 ? t : null;
}

function guasto(dove: string, e: unknown): string {
  console.error(`[prova-ingresso] ${dove}:`, e);
  return "Qualcosa non ha funzionato dalla nostra parte. Riprova fra un attimo.";
}

export type RisultatoAvvio = { ok: true; provaId: string } | { ok: false; errore: string };

export async function iniziaProva(nome: unknown, cognome: unknown): Promise<RisultatoAvvio> {
  const n = pulisci(nome);
  const c = pulisci(cognome);
  if (!n) return { ok: false, errore: "Manca il nome." };
  if (!c) return { ok: false, errore: "Manca il cognome." };

  try {
    const prova = await prisma.provaIngresso.create({
      data: { nome: n, cognome: c },
      select: { id: true },
    });
    return { ok: true, provaId: prova.id };
  } catch (e) {
    return { ok: false, errore: guasto("avvio", e) };
  }
}

export type RisultatoConsegna = { ok: true; esito: Esito } | { ok: false; errore: string };

/**
 * Corregge e salva. Si consegna una volta sola: se la prova risulta già
 * completata si restituisce l'esito che c'è, senza riscriverlo — così un doppio
 * clic, o un ritorno sulla pagina, non cancella il risultato buono.
 */
export async function consegnaProva(provaId: unknown, risposte: unknown): Promise<RisultatoConsegna> {
  if (typeof provaId !== "string" || provaId.length === 0 || provaId.length > 40) {
    return { ok: false, errore: "Prova non valida." };
  }
  if (!Array.isArray(risposte) || risposte.length > TOTALE) {
    return { ok: false, errore: "Risposte non valide." };
  }

  const pulite: RispostaData[] = [];
  for (const r of risposte as { questionId?: unknown; optionId?: unknown }[]) {
    if (typeof r?.questionId !== "string" || r.questionId.length > 20) continue;
    const optionId = typeof r.optionId === "string" && r.optionId.length <= 24 ? r.optionId : null;
    pulite.push({ questionId: r.questionId, optionId });
  }

  try {
    const esistente = await prisma.provaIngresso.findUnique({
      where: { id: provaId },
      select: { completataIl: true, esito: true },
    });
    if (!esistente) return { ok: false, errore: "Prova non trovata." };
    if (esistente.completataIl && esistente.esito) {
      return { ok: true, esito: esistente.esito as unknown as Esito };
    }

    const esito = correggi(pulite);

    await prisma.provaIngresso.update({
      where: { id: provaId },
      data: {
        completataIl: new Date(),
        punti: esito.punti,
        esito: esito as unknown as object,
        risposte: pulite as unknown as object,
      },
    });

    return { ok: true, esito };
  } catch (e) {
    return { ok: false, errore: guasto("consegna", e) };
  }
}
