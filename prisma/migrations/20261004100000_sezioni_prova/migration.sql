-- Le prove del semestre filtro si svolgono una materia per volta: il tentativo
-- ricorda quale sezione è aperta e da quando è cominciata.
ALTER TABLE "Attempt" ADD COLUMN "sezione" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Attempt" ADD COLUMN "sezioneIniziataIl" TIMESTAMP(3);
