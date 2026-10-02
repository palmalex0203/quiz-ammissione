/*
 * Come si mostra una domanda a completamento nella correzione. A scelta multipla
 * si evidenzia l'opzione giusta fra quelle elencate; qui non c'è un elenco, quindi
 * si mettono una accanto all'altra la risposta scritta e quella attesa.
 *
 * Le varianti accettate oltre alla prima si dicono comunque: servono a far capire
 * che "mitocondrio" e "mitocondri" andavano bene entrambe, invece di lasciare il
 * dubbio di essere stati puniti per un dettaglio.
 */
export function CompletionReview({
  typed,
  accepted,
}: {
  typed: string | null;
  accepted: string[];
}) {
  const scritta = typed?.trim() ?? "";
  const attesa = accepted[0] ?? "";
  const varianti = accepted.slice(1);

  return (
    <div className="mt-3 flex flex-col gap-2 text-sm">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-muted">La tua risposta:</span>
        {scritta === "" ? (
          <span className="italic text-muted">non data</span>
        ) : (
          <span className="font-mono font-semibold uppercase tracking-wider">{scritta}</span>
        )}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-muted">Risposta attesa:</span>
        <span className="font-mono font-semibold uppercase tracking-wider text-green-800 dark:text-green-300">
          {attesa}
        </span>
      </div>
      {varianti.length > 0 && (
        <p className="text-xs text-muted">
          Erano accettate anche: {varianti.join(", ")}
        </p>
      )}
    </div>
  );
}
