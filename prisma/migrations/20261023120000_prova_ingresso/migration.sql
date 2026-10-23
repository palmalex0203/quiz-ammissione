-- CreateTable
CREATE TABLE "ProvaIngresso" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "completataIl" TIMESTAMP(3),
    "punti" DOUBLE PRECISION,
    "esito" JSONB,
    "risposte" JSONB,

    CONSTRAINT "ProvaIngresso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProvaIngresso_createdAt_idx" ON "ProvaIngresso"("createdAt");
