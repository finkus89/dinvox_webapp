// Página principal temporal de Dinvox

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-5xl rounded-2xl border border-slate-200/70 bg-white/80 shadow-md p-6 md:p-8 dark:bg-slate-900/80 dark:border-slate-800 dark:shadow-lg transition-colors">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-600 dark:text-brand-400">
              Dinvox2
            </h1>
            <div className="mt-4 h-10 w-10 bg-brand-500"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Asistente para registrar y entender tus gastos diarios.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-100">
            <span className="inline-block h-2 w-2 rounded-full bg-brand-500" />
            MVP · Registro por voz y texto
          </span>
        </header>

        {/* Contenido temporal */}
        <section className="grid gap-6 md:grid-cols-[2fr,3fr]">
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Próximo: gráfico de gastos
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Aquí va la dona con las categorías (mercado, transporte, ocio, etc.) y el
              porcentaje de cada una según el filtro de fecha.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Próximo: tabla de categorías
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Aquí vamos a listar cada categoría con su total, porcentaje y la opción de
              editar o corregir la clasificación de los gastos.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
