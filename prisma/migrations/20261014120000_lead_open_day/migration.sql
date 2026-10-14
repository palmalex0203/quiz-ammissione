-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "scuola" TEXT,
    "anno" TEXT,
    "percorso" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "consensoMarketing" BOOLEAN NOT NULL DEFAULT false,
    "consensoIl" TIMESTAMP(3),
    "completataIl" TIMESTAMP(3),
    "punteggio" DOUBLE PRECISION,
    "risposte" JSONB,
    "postoDiretta" BOOLEAN NOT NULL DEFAULT false,
    "postoDirettaIl" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_percorso_idx" ON "Lead"("percorso");
