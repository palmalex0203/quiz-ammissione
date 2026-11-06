import { auth } from "@/lib/auth";
import { aggiornaRegistrazioni } from "@/lib/registrazioni";

/**
 * Cerca le registrazioni delle dirette finite e le aggancia alle lezioni.
 *
 * La chiama la pagina di una lezione finita che aspetta ancora la sua
 * registrazione (vedi AttendiRegistrazione.tsx). Serve un utente collegato,
 * studente o docente: da fuori non deve poter diventare un modo per tempestare
 * Microsoft di domande. Le domande vere, comunque, partono al massimo una volta
 * ogni cinque minuti per lezione.
 *
 * Risponde con le lezioni che ora hanno la registrazione: la pagina confronta
 * con quelle che stava aspettando e, se ce n'è una, si ricarica. Così si
 * aggiorna anche lo studente che non è stato lui a far trovare il video.
 */
export async function POST() {
  const session = await auth();
  if (!session) return Response.json({ errore: "Non autorizzato." }, { status: 401 });

  const pronte = await aggiornaRegistrazioni();
  return Response.json({ pronte });
}
