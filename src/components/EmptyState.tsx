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
          : "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-200 bg-white/60 px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-950/40"
      }
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-xl dark:bg-orange-500/10">
        {icon}
      </div>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
      {description && (
        <p className="max-w-sm text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
    </div>
  );
}
