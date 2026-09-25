/*
 * Mostrata appena si tocca una voce della barra laterale, mentre il server prepara
 * la pagina vera. Serve a dare una risposta immediata al clic: senza, il browser
 * resta fermo sulla pagina precedente e sembra che non abbia registrato il tocco.
 * Next la usa anche come anteprima da precaricare.
 */
export default function StudentLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Caricamento in corso">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-9 w-56" />
        <div className="skeleton h-4 w-80 max-w-full" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="skeleton h-48 rounded-3xl" />
        <div className="skeleton h-48 rounded-3xl" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="skeleton h-28 rounded-[1.25rem]" />
        <div className="skeleton h-28 rounded-[1.25rem]" />
        <div className="skeleton h-28 rounded-[1.25rem]" />
        <div className="skeleton h-28 rounded-[1.25rem]" />
      </div>

      <div className="skeleton h-40 rounded-[1.25rem]" />
    </div>
  );
}
