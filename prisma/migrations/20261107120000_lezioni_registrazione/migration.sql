-- Una lezione in diretta, finita, riceve il link alla sua registrazione.
-- Lo scrive il sito quando Teams l'ha pronta: vedi src/lib/registrazioni.ts.
ALTER TABLE "Lezione" ADD COLUMN "urlRegistrazione" TEXT;
