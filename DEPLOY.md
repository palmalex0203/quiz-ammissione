# Guida al deploy online

Questa guida spiega come mettere online l'app usando Vercel (per il sito) e Turso (per il database), entrambi con piano gratuito.

## Cosa serve prima di iniziare

1. Un account GitHub (gratuito) — https://github.com/join
2. Un account Turso (gratuito) — https://turso.tech
3. Un account Vercel (gratuito) — https://vercel.com/signup — puoi accedere direttamente con l'account GitHub, così ne crei uno in meno

Questi account vanno creati manualmente dall'utente nel proprio browser: sono account personali/dell'organizzazione, quindi non possono essere creati da un assistente automatico.

## Passi (una tantum)

1. **Pubblicare il codice su GitHub**: creare un nuovo repository (anche privato) e caricare il contenuto di questa cartella.
2. **Creare il database su Turso**: dalla dashboard web (turso.tech), creare un nuovo database e generare un token di accesso. Copiare l'URL `libsql://...` e il token.
3. **Applicare lo schema al database Turso**: la CLI di Turso su Windows richiede WSL, quindi si usa uno script incluso nel progetto che si appoggia al client libsql (funziona su qualunque piattaforma):
   - Creare/aggiornare un file `.env.production.local` (non viene mai caricato su GitHub) con `DATABASE_URL` e `TURSO_AUTH_TOKEN` del database Turso
   - Eseguire: `npx tsx scripts/apply-migration.ts prisma/migrations/<nome-cartella>/migration.sql` (una volta per ciascuna cartella di migrazione, in ordine cronologico)
   - Poi creare l'account insegnante: `SEED_SAMPLE_DATA=false npx tsx prisma/seed.ts` (con le stesse variabili d'ambiente caricate; il flag evita di creare studenti/test di esempio fittizi)
   - Nota: `prisma migrate deploy` **non funziona** con gli URL `libsql://` di Turso (limite noto di Prisma 7) — per questo si usa lo script sopra invece del comando standard.
4. **Collegare il repository a Vercel**: importare il progetto da GitHub nella dashboard Vercel (o `vercel link`).
5. **Configurare le variabili d'ambiente su Vercel** (Project Settings → Environment Variables):
   - `DATABASE_URL` → l'URL `libsql://...` del database Turso
   - `TURSO_AUTH_TOKEN` → il token generato al passo 2
   - `AUTH_SECRET` → un valore casuale generato apposta per la produzione (diverso da quello locale)
   - `TEACHER_NAME`, `TEACHER_EMAIL`, `TEACHER_PASSWORD` → solo necessari se si rilancia il seed in futuro
6. **Deploy**: `vercel --prod` oppure semplicemente un push su GitHub (Vercel fa il deploy automatico ad ogni push sul branch principale).

## Aggiornamenti futuri

Una volta collegato a GitHub, ogni modifica pubblicata (`git push`) genera automaticamente una nuova versione online su Vercel — non serve ripetere questi passaggi.

Se lo schema del database cambia, prima di fare il push serve applicare la nuova migrazione anche al database Turso di produzione: generarla in locale con `npx prisma migrate dev --name <descrizione>`, poi applicarla con `npx tsx scripts/apply-migration.ts prisma/migrations/<nuova-cartella>/migration.sql` (con `DATABASE_URL`/`TURSO_AUTH_TOKEN` di produzione caricati, vedi passo 3 sopra).

## Account insegnante e studenti in produzione

L'account insegnante viene creato una sola volta dal seed (passo 3). Gli account studente si creano poi direttamente dall'app, dalla pagina "Studenti" dell'insegnante — non serve più toccare il seed.

## Registrazioni automatiche delle lezioni (Teams → simulatore)

Finita una lezione in diretta, il sito chiede a Microsoft la registrazione e,
quando è pronta, mette nella scheda il pulsante «Guarda la registrazione».
Il codice è in `src/lib/registrazioni.ts`.

Il video lo cerca in tre posti, e si ferma al primo che lo ha: la raccolta
documenti del team dove si tengono le lezioni (`MS_RACCOLTA_LEZIONI`), le
cartelle delle registrazioni nel OneDrive dell'organizzatore, e in ultimo la
ricerca su tutto il 365. Serve perché il posto dipende dal tipo di riunione:
una riunione di canale finisce nel team, una riunione normale nel OneDrive di
chi la organizza.

Il link si chiede prima «per chiunque» e, se il sito ha la condivisione esterna
disattivata, «per l'organizzazione» — che va bene se gli studenti sono membri
del team.

Chi chiede, e quando:

- **la pagina di una lezione finita**, appena uno studente la apre e poi ogni
  tre minuti finché resta aperta: così il video compare pochi minuti dopo la
  fine;
- **un controllo una volta al giorno**, alle 20:00 UTC (`crons` in
  `vercel.json`): 21:00 italiane d'inverno, 22:00 d'estate, e sul piano Hobby
  Vercel lo lancia entro l'ora successiva. Serve perché la registrazione si
  agganci anche se nessuno apre quella pagina. Richiede `CRON_SECRET` fra le
  variabili d'ambiente, ed essendo letta al momento della build va messa
  **prima** del deploy.

Una volta al giorno e non più spesso perché il database si paga a tempo
accesso: nei giorni senza lezioni finite il controllo legge l'elenco dalla
cache, non trova niente e chiude senza aprirlo.

Serve, una volta sola, nel Microsoft 365 della scuola (da amministratore):

1. **Entra → Registrazioni app → Nuova registrazione**, nome «Simulatore Profor».
   Annotare *ID applicazione (client)* e *ID directory (tenant)*.
2. **Autorizzazioni API → Microsoft Graph → Autorizzazioni applicazione**:
   `OnlineMeetings.Read.All`, `OnlineMeetingRecording.Read.All`, `Files.ReadWrite.All`,
   poi **Concedi consenso amministratore**.
3. **Certificati e segreti → Nuovo segreto client**: copiare il *Valore*.
4. **Entra → Utenti →** l'account che crea le riunioni: copiare l'*ID oggetto*.
5. Policy di Teams per l'app (PowerShell, modulo `MicrosoftTeams`):
   ```powershell
   Connect-MicrosoftTeams
   New-CsApplicationAccessPolicy -Identity Simulatore-Registrazioni -AppIds "<ID applicazione>" -Description "Simulatore: registrazioni delle lezioni"
   Grant-CsApplicationAccessPolicy -PolicyName Simulatore-Registrazioni -Identity "<ID oggetto organizzatore>"
   ```
   Può metterci fino a 30 minuti ad attivarsi.
6. Solo per i link aperti a chiunque: **SharePoint admin → Criteri →
   Condivisione** sul tenant, e la condivisione del singolo sito del team, su
   «Chiunque». Senza, il link resta per i soli account della scuola.
7. Su **Vercel → Settings → Environment Variables** (Production):
   `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MS_ORGANIZZATORE_ID`,
   `MS_RACCOLTA_LEZIONI`, `CRON_SECRET`, poi un redeploy.

Senza queste variabili il sito funziona lo stesso: a lezione finita mostra
«la registrazione arriva a breve» e non cerca niente.
