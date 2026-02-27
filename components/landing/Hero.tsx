// components/landing/Hero.tsx
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-10">
        <div className="grid items-center gap-8 md:grid-cols-2">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
              <span className="inline-block h-2 w-2 rounded-full bg-brand-300" />
              MVP en construcción · WhatsApp y Telegram
            </div>

            <h1 className="mt-5 text-4xl md:text-5xl font-bold tracking-tight text-white">
              Registra tus gastos por WhatsApp o Telegram, en segundos.
            </h1>

            <p className="mt-4 text-base md:text-lg text-white/80">
              Hablas o escribes. Dinvox lo organiza y te muestra patrones con gráficos
              claros y una tabla editable. Sin fricción, sin Excel.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-500 transition"
              >
                Probar Dinvox
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white/85 hover:bg-white/15 transition"
              >
                Ver cómo funciona
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/75">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                Voz o texto
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                Multi-moneda
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                Dashboard con gráficos
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                Export CSV
              </span>
            </div>
          </div>

          {/* Right: images */}
          <div className="relative">
            {/* PC */}
            <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-black/25">
              <Image
                src="/landing/pc_hero.png"
                alt="Dashboard de Dinvox"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 92vw, 560px"
                priority
              />
            </div>

            {/* Móvil encima */}
            <div className="absolute -bottom-8 left-6 w-[42%] max-w-[260px]">
              <div className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-black/30">
                <Image
                  src="/landing/cel_hero.png"
                  alt="Dinvox en móvil"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 45vw, 260px"
                  priority
                />
              </div>
            </div>

            {/* espaciamiento abajo para que no corte el móvil */}
            <div className="h-10" />
          </div>

        </div>
      </div>

      <div className="h-10 bg-gradient-to-b from-transparent to-white/80" />
    </section>
  );
}