-- Una lezione può essere in diretta invece che registrata.
--
-- Teams non si lascia incorporare in una pagina, quindi la diretta non è un
-- lettore ma un pulsante che porta fuori: qui serve l'indirizzo intero della
-- riunione, non un identificativo di filmato.
ALTER TABLE "Lezione" ADD COLUMN "urlDiretta" TEXT;

-- E di conseguenza fornitore e identificativo del filmato non sono più
-- obbligatori: una lezione in diretta non ne ha.
ALTER TABLE "Lezione" ALTER COLUMN "fornitore" DROP NOT NULL;
ALTER TABLE "Lezione" ALTER COLUMN "videoId" DROP NOT NULL;
