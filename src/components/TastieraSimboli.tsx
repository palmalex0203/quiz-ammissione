"use client";

/*
 * I caratteri che non stanno sulla tastiera.
 *
 * Serve soprattutto a fisica, dove senza non si scrive quasi niente: «m/s²»,
 * «Δv», «μ», «Ω», «≈». La piattaforma non ha un motore per le formule — il
 * testo delle domande è testo e basta, e le barre rovesciate del LaTeX
 * verrebbero mangiate per strada — quindi le formule si scrivono con i
 * caratteri veri di Unicode. Questi.
 *
 * Senza questa striscia l'alternativa è cercare il simbolo altrove e
 * incollarlo, e chi scrive cento domande non lo fa: scrive «m/s2», oppure
 * «delta v». Poi lo studente legge quello.
 *
 * Il simbolo entra dove sta il cursore, non in fondo: a metà di una formula è
 * proprio il punto in cui serve.
 */

type Gruppo = { titolo: string; simboli: string[] };

const GRUPPI: Gruppo[] = [
  {
    titolo: "Matematica",
    simboli: ["×", "·", "÷", "±", "∓", "≈", "≠", "≤", "≥", "√", "∑", "∫", "∂", "∝", "∞", "%", "‰"],
  },
  {
    titolo: "Esponenti e pedici",
    simboli: ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁻", "⁺", "₀", "₁", "₂", "₃", "₄", "₅", "₆"],
  },
  {
    titolo: "Lettere greche",
    simboli: ["α", "β", "γ", "δ", "Δ", "ε", "η", "θ", "λ", "μ", "ν", "π", "ρ", "σ", "Σ", "τ", "φ", "Φ", "χ", "ψ", "ω", "Ω"],
  },
  {
    titolo: "Unità e frecce",
    simboli: ["°", "℃", "Å", "Ω", "µ", "→", "←", "↑", "↓", "⇌", "⇒", "∥", "⊥", "∠", "′", "″"],
  },
];

export function TastieraSimboli({
  onInserisci,
  etichetta = "Caratteri speciali",
}: {
  /** Riceve il simbolo scelto. Chi chiama sa dov'è il cursore. */
  onInserisci: (simbolo: string) => void;
  etichetta?: string;
}) {
  return (
    <details className="rounded-2xl border border-line bg-brand-tint/60">
      <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold">
        {etichetta} <span className="font-normal text-muted">— entrano dove sta il cursore</span>
      </summary>

      <div className="flex flex-col gap-3 border-t border-line px-3 py-3">
        {GRUPPI.map((g) => (
          <div key={g.titolo} className="flex flex-col gap-1.5">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">
              {g.titolo}
            </p>
            <div className="flex flex-wrap gap-1">
              {g.simboli.map((s) => (
                <button
                  key={s}
                  type="button"
                  // onMouseDown invece di onClick, con il preventDefault: al
                  // clic il campo perderebbe il fuoco prima dell'inserimento, e
                  // con il fuoco se ne va anche la posizione del cursore.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onInserisci(s);
                  }}
                  aria-label={`Inserisci ${s}`}
                  className="min-w-9 rounded-lg border border-control-line bg-card px-2 py-1.5 text-sm leading-none transition-colors hover:border-brand hover:bg-brand-soft"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
