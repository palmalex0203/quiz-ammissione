export type IconName = "target" | "grid" | "chart" | "home" | "users" | "docs";

/**
 * Icone della navigazione: tratto semplice, stessa griglia da 24, così le voci
 * restano allineate e leggibili anche piccole.
 */
export function NavIcon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[1.15rem] w-[1.15rem] shrink-0"
    >
      {name === "target" && (
        <>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3.2" />
        </>
      )}
      {name === "grid" && (
        <>
          <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
        </>
      )}
      {name === "chart" && (
        <>
          <path d="M4 20h16" />
          <path d="M7 20v-6" />
          <path d="M12 20V6" />
          <path d="M17 20v-9" />
        </>
      )}
      {name === "home" && (
        <>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6 9.8V20h12V9.8" />
        </>
      )}
      {name === "users" && (
        <>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
          <path d="M16 5.5a3 3 0 0 1 0 5.6M17.5 19c0-2.2-.8-3.9-2-5" />
        </>
      )}
      {name === "docs" && (
        <>
          <path d="M6.5 3.5h7L19 9v11.5H6.5z" />
          <path d="M13.5 3.5V9H19" />
          <path d="M9.5 13h6M9.5 16.5h4" />
        </>
      )}
    </svg>
  );
}
