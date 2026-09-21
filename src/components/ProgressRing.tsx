/**
 * Anello di avanzamento: una percentuale mostrata come arco arancione con il
 * numero al centro. Senza dati (value null) resta vuoto e mostra un trattino.
 */
export function ProgressRing({ value, size = 52 }: { value: number | null; size?: number }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div
      role="img"
      aria-label={value == null ? "Nessun dato" : `${pct}% di risposte corrette`}
      className="grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--brand) ${pct}%, var(--brand-soft) 0)`,
      }}
    >
      <span
        className="grid place-items-center rounded-full bg-card font-display text-xs font-bold tabular-nums"
        style={{ width: size - 10, height: size - 10 }}
      >
        {value == null ? "–" : `${pct}%`}
      </span>
    </div>
  );
}
