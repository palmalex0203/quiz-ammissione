/**
 * Anello di avanzamento: una percentuale mostrata come arco arancione con il
 * numero al centro. Senza dati (value null) resta vuoto e mostra un trattino.
 */
export function ProgressRing({ value, size = 52 }: { value: number | null; size?: number }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  /*
   * Il numero cresce insieme al cerchio: a dimensione fissa, l'anello da 92px
   * della pagina del risultato si ritrovava dentro un 12px.
   */
  const corpo = Math.max(11, Math.round(size * 0.26));
  /*
   * Senza dati l'anello non si colora: con la traccia arancione sembrava una
   * ciambella piena di significato, mentre vuol dire solo "non hai ancora
   * risposto a niente".
   */
  const traccia = value == null ? "var(--line)" : "var(--brand-soft)";
  return (
    <div
      role="img"
      aria-label={value == null ? "Nessun dato" : `${pct}% di risposte corrette`}
      className="grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--brand) ${pct}%, ${traccia} 0)`,
      }}
    >
      <span
        className={`grid place-items-center rounded-full bg-card font-display font-bold tabular-nums ${
          value == null ? "text-muted" : ""
        }`}
        style={{ width: size - 10, height: size - 10, fontSize: corpo }}
      >
        {value == null ? "–" : `${pct}%`}
      </span>
    </div>
  );
}
