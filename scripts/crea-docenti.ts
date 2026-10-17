/**
 * Crea gli account insegnante, generando per ciascuno una password casuale.
 *
 * Separato da create-students.ts di proposito, e non un suo parametro: un
 * insegnante vede tutto — gli studenti, i risultati di tutti, i contatti
 * dell'open day con nomi, telefoni ed email di ragazzi spesso minorenni. Non
 * dev'essere una cosa che capita per una lettera sbagliata in un comando.
 *
 * Un indirizzo già presente viene saltato, mai sovrascritto: se qualcuno
 * esiste già, questo script non gli cambia la password e non lo promuove.
 * Promuovere un account esistente è un'altra decisione e si prende a parte.
 *
 * Stampa alla fine la tabella nome / email / password: va salvata subito,
 * perché le password sono cifrate nel database e non sono più recuperabili.
 *
 * Uso:
 *   npx tsx scripts/crea-docenti.ts "Francesco" "Arianna"
 *   npx tsx scripts/crea-docenti.ts "Francesco, f.rossi@profor.it"
 *   ... --dominio profor.it     dominio per gli indirizzi generati
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const indice = process.argv.indexOf("--dominio");
const DOMINIO = indice !== -1 ? process.argv[indice + 1] : "profor.it";

// Niente caratteri ambigui (0/O, 1/l/I): le password vengono lette e digitate
// a mano, spesso da uno schermo.
const ALFABETO = "abcdefghijkmnpqrstuvwxyz23456789";

function passwordCasuale(lunghezza = 12): string {
  const bytes = crypto.getRandomValues(new Uint8Array(lunghezza));
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

function indirizzoDa(nome: string): string {
  const pulito = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/)
    .join(".");
  return `${pulito}@${DOMINIO}`;
}

async function main() {
  const voci = process.argv
    .slice(2)
    .filter((a) => a !== "--dominio" && a !== DOMINIO)
    .filter((a) => !a.startsWith("--"));

  if (voci.length === 0) {
    console.error('Uso: npx tsx scripts/crea-docenti.ts "Nome" ["Nome, email@…"] [--dominio profor.it]');
    process.exit(1);
  }

  const creati: { nome: string; email: string; password: string }[] = [];
  const saltati: string[] = [];

  for (const voce of voci) {
    const [nomeGrezzo, emailGrezza] = voce.split(",").map((p) => p?.trim());
    const nome = nomeGrezzo;
    if (!nome) continue;
    const email = (emailGrezza || indirizzoDa(nome)).toLowerCase();

    const esistente = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });
    if (esistente) {
      saltati.push(`${nome} (${email}) — esiste già come ${esistente.role}`);
      continue;
    }

    const password = passwordCasuale();
    await prisma.user.create({
      data: { name: nome, email, passwordHash: await bcrypt.hash(password, 10), role: "TEACHER" },
    });
    creati.push({ nome, email, password });
  }

  console.log(`\nCreati ${creati.length} insegnanti${saltati.length ? `, ${saltati.length} saltati` : ""}.\n`);

  if (saltati.length) {
    console.log("Saltati (non modificati):");
    for (const s of saltati) console.log(`  ${s}`);
    console.log("");
  }

  if (creati.length === 0) return;

  console.log("CREDENZIALI DA CONSEGNARE — salvarle ora, non saranno più recuperabili:\n");
  console.log("nome".padEnd(20) + "email".padEnd(32) + "password");
  console.log("-".repeat(66));
  for (const c of creati) console.log(c.nome.padEnd(20) + c.email.padEnd(32) + c.password);
  console.log(
    "\nUn insegnante vede tutto: studenti, risultati e i contatti dell'open day.\nConsegnale a voce o su un canale privato, non in un gruppo."
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
