export function EmptyState({
  icon,
  title,
  description,
  bare,
}: {
  icon: string;
  title: string;
  description?: string;
  bare?: boolean;
}) {
  return (
    <div
      className={
        bare
          ? "flex flex-col items-center gap-2 py-6 text-center"
          : "flex flex-col items-center gap-2 rounded-3xl border border-dashed border-line bg-card/60 px-6 py-10 text-center"
      }
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-xl">{icon}</div>
      <p className="font-display text-base font-bold">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
    </div>
  );
}
