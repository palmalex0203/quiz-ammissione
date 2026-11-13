-- Una lezione importata dal calendario del team ricorda da quale riunione viene.
-- Serve a non importarla due volte: vedi src/lib/calendario.ts.
ALTER TABLE "Lezione" ADD COLUMN "riunioneId" TEXT;
CREATE UNIQUE INDEX "Lezione_riunioneId_key" ON "Lezione"("riunioneId");
