// app/page.tsx
// Landing pública (temporal) de Dinvox
// - Objetivo: explicar beneficios y llevar a Login/Register
// - Página temporal (en construcción)

import Link from "next/link";

export default function Home() {
  return (
    // ✅ Mismo fondo que app/(auth)/layout.tsx
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-700 via-slate-600 to-brand-500">
      <main className="min-h-screen flex items-center justify-center px-4 py-10">
        <div
          className="
            w-full max-w-5xl
            rounded-2xl
            border border-white/20
            bg-white/10
            backdrop-blur-xl
            shadow-2xl shadow-black/20
            p-6 md:p-10
            transition-colors
          "
        >
          {/* Aviso temporal */}
          <div className="mb-6 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white/80">
            🚧 <span className="font-semibold">Página temporal (en construcción).</span>{" "}
            Puedes probar Dinvox creando una cuenta o iniciando sesión.
          </div>

          {/* Header */}
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Dinvox
              </h1>
              <p className="mt-2 text-white/80">
                Registra tus gastos por <span className="font-semibold">voz o texto</span> y
                entiende en qué se te va la plata, sin fricción.
              </p>

              {/* Badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                  <span className="inline-block h-2 w-2 rounded-full bg-brand-300" />
                  MVP · WhatsApp y Telegram
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                  Dashboard · Resumen + Categorías
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-2 md:justify-end">
              <Link
                href="/login"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/85 hover:bg-white/15 transition"
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
            <div className="rounded-xl border border-white/20 bg-white/10 p-5 text-white/85">
              <h2 className="text-sm font-semibold text-white">Beneficios</h2>

              <ul className="mt-3 space-y-2 text-sm text-white/80">
                <li>• Registra en segundos, sin llenar formularios.</li>
                <li>• Categorías claras para ver patrones de gasto.</li>
                <li>• Resumen por día/semana/mes y por rango.</li>
                <li>• Multi-moneda y formato por idioma.</li>
              </ul>
            </div>

            {/* Cómo funciona */}
            <div className="rounded-xl border border-white/20 bg-white/10 p-5 text-white/85">
              <h2 className="text-sm font-semibold text-white">Cómo funciona</h2>

              <ol className="mt-3 space-y-2 text-sm text-white/80">
                <li>1) Envías un gasto por voz o texto.</li>
                <li>2) Dinvox lo clasifica y lo guarda.</li>
                <li>3) Abres el dashboard y ves el resumen.</li>
              </ol>

              <p className="mt-3 text-xs text-white/70">
                Ideal para arrancar hábito sin complicarte.
              </p>
            </div>

            {/* Qué verás */}
            <div className="rounded-xl border border-white/20 bg-white/10 p-5 text-white/85">
              <h2 className="text-sm font-semibold text-white">Qué verás</h2>

              <ul className="mt-3 space-y-2 text-sm text-white/80">
                <li>• Total gastado en el periodo.</li>
                <li>• Distribución por categoría (dona + barras).</li>
                <li>• Tabla de gastos con edición y export CSV.</li>
                <li>• Insights simples (próximo paso).</li>
              </ul>
            </div>
          </section>

          {/* CTA final */}
          <section className="mt-8 rounded-xl border border-white/20 bg-white/10 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Empieza hoy en menos de 2 minutos
                </h3>
                <p className="text-sm text-white/80">
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
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/85 hover:bg-white/15 transition"
                >
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}