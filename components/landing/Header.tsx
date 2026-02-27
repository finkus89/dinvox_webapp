// components/landing/Header.tsx
import Image from "next/image";
import Link from "next/link";

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Dinvox" width={36} height={36} priority />
          <span className="text-white font-semibold tracking-tight">Dinvox</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
          <a href="#como-funciona" className="hover:text-white transition">
            Cómo funciona
          </a>
          <a href="#beneficios" className="hover:text-white transition">
            Beneficios
          </a>
          <a href="#PricingTeaser" className="hover:text-white transition">
            Precios
          </a>
          <a href="#faq" className="hover:text-white transition">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
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
      </div>
    </header>
  );
}