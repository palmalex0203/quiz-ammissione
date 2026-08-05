# Guida al deploy online

Questa guida spiega come mettere online l'app usando Vercel (per il sito) e Turso (per il database), entrambi con piano gratuito.

## Cosa serve prima di iniziare

1. Un account GitHub (gratuito) — https://github.com/join
2. Un account Turso (gratuito) — https://turso.tech
3. Un account Vercel (gratuito) — https://vercel.com/signup — puoi accedere direttamente con l'account GitHub, così ne crei uno in meno

Questi account vanno creati manualmente dall'utente nel proprio browser: sono account personali/dell'organizzazione, quindi non possono essere creati da un assistente automatico.

## Passi (una tantum)

1. **Pubblicare il codice su GitHub**: creare un nuovo repository (anche privato) e caricare il contenuto di questa cartella.
2. **Creare il database su Turso**: `turso db create quiz-ammissione`, poi recuperare l'URL (`turso db show quiz-ammissione --url`) e un token (`turso db tokens create quiz-ammissione`).
3. **Eseguire le migrazioni sul database Turso**: puntare temporaneamente `DATABASE_URL`/`TURSO_AUTH_TOKEN` al database Turso ed eseguire `npx prisma migrate deploy`, poi `npx prisma db seed` per creare l'account insegnante iniziale.
4. **Collegare il repository a Vercel**: importare il progetto da GitHub nella dashboard Vercel (o `vercel link`).
5. **Configurare le variabili d'ambiente su Vercel** (Project Settings → Environment Variables):
   - `DATABASE_URL` → l'URL `libsql://...` del database Turso
   - `TURSO_AUTH_TOKEN` → il token generato al passo 2
   - `AUTH_SECRET` → un valore casuale generato apposta per la produzione (diverso da quello locale)
   - `TEACHER_NAME`, `TEACHER_EMAIL`, `TEACHER_PASSWORD` → solo necessari se si rilancia il seed in futuro
6. **Deploy**: `vercel --prod` oppure semplicemente un push su GitHub (Vercel fa il deploy automatico ad ogni push sul branch principale).

## Aggiornamenti futuri

Una volta collegato a GitHub, ogni modifica pubblicata (`git push`) genera automaticamente una nuova versione online su Vercel — non serve ripetere questi passaggi.

Se lo schema del database cambia, prima di fare il push serve eseguire una nuova migrazione anche sul database Turso di produzione con `npx prisma migrate deploy` (puntando a `DATABASE_URL`/`TURSO_AUTH_TOKEN` di produzione).

## Account insegnante e studenti in produzione

L'account insegnante viene creato una sola volta dal seed (passo 3). Gli account studente si creano poi direttamente dall'app, dalla pagina "Studenti" dell'insegnante — non serve più toccare il seed.
