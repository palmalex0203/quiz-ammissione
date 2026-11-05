/**
 * Crea gli account studente da un elenco, generando per ciascuno una password
 * casuale da consegnare in classe.
 *
 * L'elenco è un file di testo con una riga per studente:
 *   Nome Cognome, email@esempio.it
 * Se l'email manca viene generata da nome e cognome sul dominio indicato.
 *
 * Stampa alla fine la tabella nome / email / password: va salvata subito, perché
 * le password sono cifrate nel database e non sono più recuperabili.
 *
 * Uso:
 *   npx tsx scripts/create-students.ts --in studenti.txt
 *   ... --dominio profor.it     dominio per le email generate
 *   ... --percorso SEMESTRE_FILTRO   percorso assegnato (default Professioni Sanitarie)
 *   ... --blocca                 lo studente vede solo quel percorso, senza selettore
 *   ... --password-nome          password = NOME e COGNOME maiuscoli, senza spazi
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { DEFAULT_TRACK, isTrackId } from "../src/lib/tracks";

const arg = (name: string, fallback: string | null = null) => {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : fallback;
};
const IN = arg("--in");
const DOMINIO = arg("--dominio", "profor.it")!;
const PERCORSO = arg("--percorso", DEFAULT_TRACK)!;
const BLOCCA = process.argv.includes("--blocca");
const PASSWORD_NOME = process.argv.includes("--password-nome");
if (!isTrackId(PERCORSO)) throw new Error(`Percorso sconosciuto: ${PERCORSO}`);

// "Matteo Arciello" -> "MATTEOARCIELLO": lettere soltanto, senza accenti né apostrofi.
function passwordDaNome(nome: string): string {
  return nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z]/g, "").toUpperCase();
}

// Niente caratteri ambigui (0/O, 1/l/I): le password vengono lette e digitate a mano.
const ALFABETO = "abcdefghijkmnpqrstuvwxyz23456789";

function passwordCasuale(lunghezza = 10): string {
  const bytes = crypto.getRandomValues(new Uint8Array(lunghezza));
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

function emailDa(nome: string): string {
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
  if (!IN) throw new Error("Indicare il file con l'elenco: --in studenti.txt");

  const righe = readFileSync(IN, "utf8")
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter((r) => r && !r.startsWith("#"));

  const creati: { nome: string; email: string; password: string }[] = [];
  const saltati: string[] = [];

  for (const riga of righe) {
    const [nomeRaw, emailRaw] = riga.split(",").map((p) => p?.trim());
    const nome = nomeRaw;
    const email = (emailRaw || emailDa(nome)).toLowerCase();

    const esistente = await prisma.user.findUnique({ where: { email } });
    if (esistente) {
      saltati.push(`${nome} (${email})`);
      continue;
    }

    const password = PASSWORD_NOME ? passwordDaNome(nome) : passwordCasuale();
    await prisma.user.create({
      data: {
        name: nome,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: "STUDENT",
        track: PERCORSO,
        trackLocked: BLOCCA,
      },
    });
    creati.push({ nome, email, password });
  }

  console.log(`\nCreati ${creati.length} studenti${saltati.length ? `, ${saltati.length} già esistenti` : ""}.\n`);
  if (saltati.length) {
    console.log("Già presenti (non modificati):");
    for (const s of saltati) console.log(`  ${s}`);
    console.log("");
  }

  console.log("CREDENZIALI DA CONSEGNARE — salvarle ora, non saranno più recuperabili:\n");
  console.log("nome".padEnd(28) + "email".padEnd(38) + "password");
  console.log("-".repeat(78));
  for (const c of creati) console.log(c.nome.padEnd(28) + c.email.padEnd(38) + c.password);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
