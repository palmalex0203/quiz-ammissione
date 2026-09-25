// Stessa idea della pagina studente: risposta immediata al clic sulla barra laterale.
export default function TeacherLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Caricamento in corso">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-9 w-48" />
        <div className="skeleton h-4 w-72 max-w-full" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="skeleton h-20 rounded-[1.25rem]" />
        <div className="skeleton h-20 rounded-[1.25rem]" />
        <div className="skeleton h-20 rounded-[1.25rem]" />
        <div className="skeleton h-20 rounded-[1.25rem]" />
      </div>
    </div>
  );
}
