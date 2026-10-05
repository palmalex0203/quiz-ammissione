-- Quante risposte sono state date in ciascuna materia di un tentativo.
--
-- Il riepilogo per materia conservava solo le corrette e il totale: bastava per
-- la percentuale, non per il voto. Nel semestre filtro una risposta sbagliata
-- toglie 0,1 e una lasciata in bianco non toglie niente, quindi senza sapere
-- quante risposte sono state date il punteggio della singola prova non è
-- ricostruibile. Il valore predefinito 0 vale per le righe già scritte: le
-- riempie scripts/backfill-subject-stats.ts.
ALTER TABLE "AttemptSubjectStat" ADD COLUMN "answered" INTEGER NOT NULL DEFAULT 0;
