import { ALL_TRACKS, DEFAULT_TRACK } from "@/lib/tracks";

/**
 * Scelta del percorso nei form dell'insegnante. Il percorso decide a quali studenti
 * compare il test e con quale punteggio viene corretto.
 */
export function TrackField({ value }: { value?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="track" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Percorso
      </label>
      <select id="track" name="track" defaultValue={value ?? DEFAULT_TRACK} className="field">
        {ALL_TRACKS.map((track) => (
          <option key={track.id} value={track.id}>
            {track.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted">Il test compare solo agli studenti che stanno seguendo questo percorso.</p>
    </div>
  );
}
