"use client";

import { useState } from "react";

type Point = { date: string; percentage: number };

const WIDTH = 640;
const HEIGHT = 180;
const PAD_LEFT = 32;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

export function TrendChart({ points }: { points: Point[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length < 2) {
    return (
      <p className="text-sm text-muted">
        Servono almeno due tentativi per mostrare un andamento nel tempo.
      </p>
    );
  }

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  // Il punteggio può essere negativo (le risposte errate tolgono punti): il dominio
  // dell'asse Y si estende sotto lo zero solo se serve, arrotondato ai 10 più vicini.
  const dataMin = Math.min(0, ...points.map((p) => p.percentage));
  const yMin = Math.floor(dataMin / 10) * 10;
  const yMax = 100;
  const yRange = yMax - yMin;

  const xFor = (i: number) => PAD_LEFT + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const yFor = (pct: number) => PAD_TOP + plotH - ((pct - yMin) / yRange) * plotH;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.percentage)}`).join(" ");
  const gridSteps = [yMin, ...(yMin < 0 ? [0] : []), 25, 50, 75, 100].filter(
    (v, i, arr) => arr.indexOf(v) === i && v >= yMin && v <= yMax
  );

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let best = Infinity;
    points.forEach((_, i) => {
      const d = Math.abs(xFor(i) - relX);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const hovered = hoverIndex != null ? points[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
        role="img"
        aria-label="Andamento del punteggio percentuale nel tempo"
      >
        {gridSteps.map((step) => (
          <g key={step}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={yFor(step)}
              y2={yFor(step)}
              stroke="currentColor"
              strokeWidth={1}
              className="text-zinc-200 dark:text-zinc-800"
            />
            <text
              x={PAD_LEFT - 6}
              y={yFor(step)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-zinc-400 text-[9px] dark:fill-zinc-600"
            >
              {step}
            </text>
          </g>
        ))}

        <path d={linePath} fill="none" stroke="var(--brand)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {hoverIndex != null && (
          <line
            x1={xFor(hoverIndex)}
            x2={xFor(hoverIndex)}
            y1={PAD_TOP}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="currentColor"
            strokeWidth={1}
            className="text-zinc-300 dark:text-zinc-700"
          />
        )}

        {points.map((p, i) => (
          <circle
            key={i}
            cx={xFor(i)}
            cy={yFor(p.percentage)}
            r={hoverIndex === i ? 5 : 3}
            fill="var(--brand)"
            stroke="var(--background)"
            strokeWidth={2}
          />
        ))}

        <text
          x={xFor(points.length - 1)}
          y={yFor(points[points.length - 1].percentage) - 10}
          textAnchor="end"
          className="fill-zinc-700 text-[10px] font-medium dark:fill-zinc-300"
        >
          {points[points.length - 1].percentage}%
        </text>
      </svg>

      {hovered && hoverIndex != null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-900"
          style={{
            left: `${(xFor(hoverIndex) / WIDTH) * 100}%`,
            top: `${(yFor(hovered.percentage) / HEIGHT) * 100}%`,
          }}
        >
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{hovered.percentage}%</p>
          <p className="text-zinc-500 dark:text-zinc-400">{hovered.date}</p>
        </div>
      )}
    </div>
  );
}
