import { prisma } from "../src/lib/prisma";
import { fineLezione } from "../src/lib/lezioni";
import { cercaRegistrazione } from "../src/lib/registrazioni";

const TITOLO = process.argv[2] ?? "Fisica · Lezione 2";

async function main() {
  const l = await prisma.lezione.findFirst({
    where: { titolo: { contains: TITOLO } },
    select: { id: true, titolo: true, data: true, durataMinuti: true, urlDiretta: true },
  });
  if (!l) throw new Error("lezione non trovata");
  console.log(`lezione: ${l.titolo}`);

  console.log("1. chiedo a Microsoft il link alla registrazione…");
  const url = await cercaRegistrazione(
    l.urlDiretta!,
    new Date(l.data),
    fineLezione({ data: l.data, durataMinuti: l.durataMinuti })
  );
  if (!url) { console.log("   NIENTE: nessun link"); return; }
  console.log(`   OK: ${url}\n`);

  console.log("2. provo ad aprirlo senza essere collegato…");
  const r = await fetch(url, { redirect: "follow" });
  const finale = new URL(r.url);
  const login = /login\.microsoftonline|\/_layouts\/15\/(Authenticate|signin)/i.test(r.url);
  console.log(`   ${r.status} → ${finale.host}${finale.pathname.slice(0, 40)}`);
  console.log(`   ${login ? "chiede l'accesso (link per l'organizzazione)" : "si apre senza accesso"}\n`);

  console.log("3. salvo il link nella lezione…");
  await prisma.lezione.update({ where: { id: l.id }, data: { urlRegistrazione: url } });
  console.log("   salvato\n");

  console.log("4. svuoto la cache del sito…");
  const sito = process.env.SITO_URL!.replace(/\/$/, "");
  const rv = await fetch(`${sito}/api/appunti/revalida`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.APPUNTI_REVALIDA_TOKEN}` },
  });
  console.log(`   ${rv.status}: ${(await rv.text()).slice(0, 120)}`);
}

main().catch((e) => { console.error("ERRORE:", e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
