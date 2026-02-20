// app/page.tsx
// Landing pública (temporal) de Dinvox
// - Objetivo: explicar beneficios y llevar a Login/Register
// - No requiere Carrd: esto puede vivir en el mismo Next.js

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl rounded-2xl border border-slate-200/70 bg-white/80 shadow-md p-6 md:p-10 dark:bg-slate-900/80 dark:border-slate-800 dark:shadow-lg transition-colors">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-600 dark:text-brand-400">
              Dinvox
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Registra tus gastos por <span className="font-semibold">voz o texto</span> y
              entiende en qué se te va la plata, sin fricción.
            </p>

            {/* Badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-100">
                <span className="inline-block h-2 w-2 rounded-full bg-brand-500" />
                MVP · WhatsApp y Telegram
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Dashboard · Resumen + Categorías
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2 md:justify-end">
            <Link
              href="/login"
              className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white transition dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition"
            >
              Crear cuenta
            </Link>
          </div>
        </header>

        {/* Body */}
        <section className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Beneficios */}
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/70">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Beneficios
            </h2>

            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>• Registra en segundos, sin llenar formularios.</li>
              <li>• Categorías claras para ver patrones de gasto.</li>
              <li>• Resumen por día/semana/mes y por rango.</li>
              <li>• Multi-moneda y formato por idioma.</li>
            </ul>
          </div>

          {/* Cómo funciona */}
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/70">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Cómo funciona
            </h2>

            <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>1) Envías un gasto por voz o texto.</li>
              <li>2) Dinvox lo clasifica y lo guarda.</li>
              <li>3) Abres el dashboard y ves el resumen.</li>
            </ol>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Ideal para arrancar hábito sin complicarte.
            </p>
          </div>

          {/* Qué verás */}
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/70">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Qué verás
            </h2>

            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>• Total gastado en el periodo.</li>
              <li>• Distribución por categoría (dona + barras).</li>
              <li>• Tabla de gastos con edición y export CSV.</li>
              <li>• Insights simples (próximo paso).</li>
            </ul>
          </div>
        </section>

        {/* CTA final */}
        <section className="mt-8 rounded-xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Empieza hoy en menos de 2 minutos
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Crea tu cuenta, conecta tu canal y registra tu primer gasto.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/register"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white transition dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
