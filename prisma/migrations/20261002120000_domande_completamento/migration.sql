-- Domande a completamento: lo studente scrive la risposta invece di sceglierla.
ALTER TYPE "QuestionType" ADD VALUE 'COMPLETAMENTO';

-- Il testo digitato dallo studente.
ALTER TABLE "AnswerRecord" ADD COLUMN "typedAnswer" TEXT;
