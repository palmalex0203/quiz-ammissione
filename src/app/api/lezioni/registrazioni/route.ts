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

/*
 * Il controllo della sera, lanciato da Vercel (l'orario sta in vercel.json).
 *
 * Senza questo, le registrazioni si agganciano solo quando qualcuno apre la
 * scheda di una lezione: funziona, ma vuol dire che il primo studente della
 * classe fa il lavoro per tutti e che, se nessuno apre quella pagina, la
 * registrazione resta sospesa. Una volta al giorno, a lezioni finite, il sito
 * se lo chiede da sé.
 *
 * Una volta al giorno e non ogni mezz'ora per una ragione precisa: il database
 * si paga a tempo accesso, non a interrogazioni, e un controllo che gira in
 * continuazione lo tiene sveglio per niente. Nei giorni senza lezioni finite
 * questo controllo non apre nemmeno il database: legge l'elenco dalla cache,
 * non trova niente da fare e chiude.
 *
 * Autorizzazione: Vercel manda CRON_SECRET nell'intestazione, come fa il
 * browser con una password. Senza, questo indirizzo sarebbe un modo per
 * chiunque di far tempestare Microsoft di domande.
 */
export async function GET(request: Request) {
  const atteso = process.env.CRON_SECRET;
  if (!atteso) {
    return Response.json({ errore: "CRON_SECRET non configurato." }, { status: 501 });
  }

  const dato = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (dato !== atteso) {
    return Response.json({ errore: "Non autorizzato." }, { status: 401 });
  }

  const pronte = await aggiornaRegistrazioni();
  return Response.json({ ok: true, conRegistrazione: pronte.length });
}

/*
 * Una lezione alla volta, e ogni domanda a Microsoft sono tre o quattro
 * chiamate: con quattro lezioni da controllare i dieci secondi predefiniti
 * finiscono, e il controllo serale morirebbe a metà senza dirlo a nessuno.
 */
export const maxDuration = 60;
