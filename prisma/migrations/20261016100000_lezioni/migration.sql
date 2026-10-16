-- CreateTable
CREATE TABLE "Lezione" (
    "id" TEXT NOT NULL,
    "titolo" TEXT NOT NULL,
    "descrizione" TEXT,
    "track" TEXT NOT NULL,
    "subject" TEXT,
    "topic" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "durataMinuti" INTEGER,
    "fornitore" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lezione_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lezione_track_isPublished_idx" ON "Lezione"("track", "isPublished");

-- CreateIndex
CREATE INDEX "Lezione_topic_idx" ON "Lezione"("topic");
