-- Percorsi: Professioni Sanitarie (i dati già esistenti) e Semestre filtro.
ALTER TABLE "User" ADD COLUMN "track" TEXT NOT NULL DEFAULT 'PROFESSIONI_SANITARIE';
ALTER TABLE "Test" ADD COLUMN "track" TEXT NOT NULL DEFAULT 'PROFESSIONI_SANITARIE';
CREATE INDEX "Test_track_idx" ON "Test"("track");
