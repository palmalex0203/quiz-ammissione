import { revalidateTag } from "next/cache";
import { NOTES_TAG } from "@/lib/notes";

/**
 * Svuota la cache degli appunti.
 *
 * Gli appunti vengono letti dalla cache (vedi src/lib/notes.ts) e la cache si
 * svuota da sola solo quando l'insegnante salva o pubblica dalla sua area. Chi
 * invece carica gli appunti con `scripts/import-appunti.ts` scrive direttamente
 * nel database, e la modifica resta invisibile agli studenti fino alla scadenza
 * dell'ora. È già successo: un appunto pubblicato e non visibile sembra un
 * guasto, mentre è solo la cache che non è stata avvisata.
 *
 * Questa rotta esiste perché lo script possa avvisarla. Richiede
 * APPUNTI_REVALIDA_TOKEN, altrimenti chiunque potrebbe far ricaricare gli
 * appunti a ripetizione e tenere acceso il database per niente.
 */
export async function POST(request: Request) {
  const atteso = process.env.APPUNTI_REVALIDA_TOKEN;
  if (!atteso) {
    return Response.json({ errore: "APPUNTI_REVALIDA_TOKEN non configurato." }, { status: 501 });
  }

  const dato = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (dato !== atteso) {
    return Response.json({ errore: "Non autorizzato." }, { status: 401 });
  }

  // "max": chi sta già leggendo riceve subito la versione vecchia mentre quella
  // nuova viene ricostruita, invece di restare ad aspettare. La forma a un solo
  // argomento è deprecata in questa versione di Next.
  revalidateTag(NOTES_TAG, "max");
  return Response.json({ ok: true, svuotata: NOTES_TAG });
}
