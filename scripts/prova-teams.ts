/*
 * Prova del collegamento con Teams (diagnostica, non fa parte del sito).
 *
 * Quattro domande, in ordine di quello che può essere andato storto:
 *   1. Microsoft ci riconosce?                   -> tenant, client, segreto
 *   2. trova le riunioni delle lezioni?          -> policy di Teams, organizzatore
 *   3. ci fa leggere le loro registrazioni?      -> OnlineMeetingRecording.Read.All
 *   4. vediamo il OneDrive dell'organizzatore?   -> Files.ReadWrite.All
 *
 * Non stampa mai gli indirizzi delle riunioni: quelli restano nel database.
 */
import { prisma } from "../src/lib/prisma";

const c = {
  tenant: process.env.MS_TENANT_ID!,
  client: process.env.MS_CLIENT_ID!,
  segreto: process.env.MS_CLIENT_SECRET!,
  organizzatore: process.env.MS_ORGANIZZATORE_ID!,
};

const UTENTE = encodeURIComponent(c.organizzatore);
let token = "";

async function gettone(): Promise<string> {
  const r = await fetch(`https://login.microsoftonline.com/${c.tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: c.client,
      client_secret: c.segreto,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`token ${r.status}: ${t.slice(0, 300)}`);
  return JSON.parse(t).access_token as string;
}

async function chiedi(percorso: string) {
  const r = await fetch(`https://graph.microsoft.com/v1.0${percorso}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return { stato: r.status, corpo: await r.text() };
}

const breve = (s: string) => s.replace(/\s+/g, " ").slice(0, 220);

async function main() {
  for (const [k, v] of Object.entries(c)) if (!v) throw new Error(`manca ${k} in .env`);

  console.log("1. accesso a Microsoft…");
  token = await gettone();
  console.log("   OK: gettone ottenuto\n");

  console.log("2. le riunioni delle lezioni inserite…");
  const lezioni = await prisma.lezione.findMany({
    where: { urlDiretta: { not: null } },
    select: { titolo: true, data: true, urlDiretta: true },
    orderBy: { data: "asc" },
  });
  if (lezioni.length === 0) console.log("   nessuna lezione in diretta nel database");

  const trovate: { titolo: string; quando: string; id: string }[] = [];

  for (const l of lezioni) {
    const numero = /\/meet\/(\d{6,})/.exec(l.urlDiretta!)?.[1];
    const filtro = numero
      ? `joinMeetingIdSettings/joinMeetingId eq '${numero}'`
      : `JoinWebUrl eq '${l.urlDiretta!.replace(/'/g, "''")}'`;
    const r = await chiedi(`/users/${UTENTE}/onlineMeetings?$filter=${encodeURIComponent(filtro)}`);
    const quando = l.data.toLocaleDateString("it-IT", { timeZone: "Europe/Rome" });

    if (r.stato !== 200) {
      const motivo =
        r.stato === 403 ? "PERMESSO NEGATO: policy di Teams non attiva" : breve(r.corpo);
      console.log(`   ${l.titolo} (${quando}): errore ${r.stato} — ${motivo}`);
      continue;
    }
    const riunioni = (JSON.parse(r.corpo).value ?? []) as { id: string }[];
    if (riunioni.length === 0) {
      console.log(`   ${l.titolo} (${quando}): non trovata`);
      continue;
    }
    console.log(`   ${l.titolo} (${quando}): riunione TROVATA`);
    trovate.push({ titolo: l.titolo, quando, id: riunioni[0].id });
  }

  console.log("\n3. le registrazioni di quelle riunioni…");
  for (const t of trovate) {
    const r = await chiedi(`/users/${UTENTE}/onlineMeetings/${encodeURIComponent(t.id)}/recordings`);
    if (r.stato !== 200) {
      const motivo =
        r.stato === 403
          ? "PERMESSO NEGATO: manca OnlineMeetingRecording.Read.All o il consenso"
          : breve(r.corpo);
      console.log(`   ${t.titolo} (${t.quando}): errore ${r.stato} — ${motivo}`);
      continue;
    }
    const reg = (JSON.parse(r.corpo).value ?? []) as { createdDateTime: string; endDateTime?: string }[];
    if (reg.length === 0) {
      console.log(`   ${t.titolo} (${t.quando}): nessuna registrazione`);
      continue;
    }
    const complete = reg.filter((x) => x.endDateTime).length;
    console.log(`   ${t.titolo} (${t.quando}): ${reg.length} registrazione/i, ${complete} complete`);
  }

  console.log("\n4. il OneDrive dell'organizzatore…");
  let vista = false;
  for (const cartella of ["Recordings", "Registrazioni"]) {
    const r = await chiedi(
      `/users/${UTENTE}/drive/root:/${cartella}:/children?$top=200&$select=id,name,createdDateTime,file`
    );
    if (r.stato === 200) {
      const file = (JSON.parse(r.corpo).value ?? []) as { name: string }[];
      const mp4 = file.filter((f) => /\.mp4$/i.test(f.name)).length;
      console.log(`   cartella "${cartella}": ${file.length} elementi, di cui ${mp4} video mp4`);
      vista = true;
    } else if (r.stato === 404) {
      console.log(`   cartella "${cartella}": non esiste`);
      vista = true;
    } else {
      console.log(`   cartella "${cartella}": errore ${r.stato} — ${breve(r.corpo)}`);
    }
  }
  if (!vista) console.log("   nessuna cartella leggibile: controlla Files.ReadWrite.All");
}

main()
  .catch((e) => { console.error("ERRORE:", e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
