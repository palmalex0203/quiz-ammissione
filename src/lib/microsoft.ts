/*
 * Il collegamento a Microsoft: le credenziali e il gettone.
 *
 * Due parti del sito parlano con Microsoft — le registrazioni delle lezioni
 * (src/lib/registrazioni.ts) e il calendario del team (src/lib/calendario.ts) —
 * e parlano con la stessa app registrata. Il gettone d'accesso sta qui una
 * volta sola: due copie vorrebbero dire due gettoni, due scadenze da seguire e
 * il doppio delle richieste di accesso a Microsoft per niente.
 *
 * Cosa serve su Microsoft (una volta sola, vedi DEPLOY.md): un'app registrata
 * in Entra con i permessi applicativi, e il consenso dell'amministratore.
 */

const GRAPH = "https://graph.microsoft.com/v1.0";

export type ConfigMicrosoft = {
  tenant: string;
  client: string;
  segreto: string;
  /** L'ID oggetto dell'account che crea le riunioni delle lezioni. */
  organizzatore: string;
  /** La raccolta documenti del team dove si tengono le lezioni, se c'è. */
  raccolta: string | null;
};

export function configMicrosoft(): ConfigMicrosoft | null {
  const tenant = process.env.MS_TENANT_ID;
  const client = process.env.MS_CLIENT_ID;
  const segreto = process.env.MS_CLIENT_SECRET;
  const organizzatore = process.env.MS_ORGANIZZATORE_ID;
  if (!tenant || !client || !segreto || !organizzatore) return null;
  return { tenant, client, segreto, organizzatore, raccolta: process.env.MS_RACCOLTA_LEZIONI ?? null };
}

// Il gettone dura un'ora: lo si tiene finché la funzione resta viva.
let gettone: { valore: string; scade: number } | null = null;

async function gettoneGraph(c: ConfigMicrosoft): Promise<string> {
  if (gettone && gettone.scade > Date.now() + 60_000) return gettone.valore;

  const r = await fetch(`https://login.microsoftonline.com/${c.tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: c.client,
      client_secret: c.segreto,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Accesso a Microsoft rifiutato (${r.status}): ${await r.text()}`);

  const j = (await r.json()) as { access_token: string; expires_in: number };
  gettone = { valore: j.access_token, scade: Date.now() + j.expires_in * 1000 };
  return gettone.valore;
}

/** Una domanda a Microsoft Graph, già autenticata. */
export async function graph<T>(
  c: ConfigMicrosoft,
  percorso: string,
  init?: RequestInit
): Promise<T> {
  const r = await fetch(`${GRAPH}${percorso}`, {
    ...init,
    headers: {
      authorization: `Bearer ${await gettoneGraph(c)}`,
      "content-type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Graph ${percorso} → ${r.status}: ${await r.text()}`);
  return (await r.json()) as T;
}
