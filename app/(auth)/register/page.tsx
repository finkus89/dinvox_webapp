"use client";

/* 
  Página de registro de Dinvox
  ----------------------------
  - Mantiene el diseño de 2 columnas (izquierda branding, derecha formulario)
  - Adaptada desde Trasari pero con colores/gradientes de Dinvox
  - Form fields: nombre, correo, teléfono, contraseña, confirmar contraseña
  - Incluye checkbox de términos + enlace para iniciar sesión
*/

import { useState } from "react";
import Image from "next/image";
import {
  COUNTRIES_CONFIG,
  COUNTRY_LIST,
  type CountryId,
  type CountryConfig,
} from "@/lib/dinvox/countries-config";

export default function RegisterPage() {
  // ================================
  // ESTADOS DEL FORMULARIO
  // ================================
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  //para el cel
  const [currentCountry, setCurrentCountry] = useState<CountryConfig>(
  COUNTRIES_CONFIG.CO
    );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  return (
    <main className="grid grid-cols-1 md:grid-cols-2 md:h-screen">

      {/* ================================
          COLUMNA IZQUIERDA: BRANDING
         ================================ */}
      <section
        className="
          relative hidden md:flex
          bg-gradient-to-br from-slate-700 via-slate-600 to-brand-500
          text-white
          md:sticky md:top-0 md:h-screen
          items-center
        "
      >
        {/* Barra superior: logo + link login */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6">
          <Image
            src="/logo.svg"
            alt="Logo Dinvox"
            width={56}
            height={56}
            className="object-contain"
          />

          <a
            href="/login"
            className="text-sm opacity-80 hover:opacity-100 hover:underline"
          >
            Iniciar sesión
          </a>
        </div>

        {/* Texto central */}
        <div className="m-auto max-w-md p-9">
          <h2 className="text-3xl font-semibold mb-3">
            Registrate en Dinvox
          </h2>

          <p className="text-white/80 text-lg">
            Comienza a registrar tus gastos con tu voz o texto simple.
            </p>
          <p className="text-white/80 text-lg">
            Dinvox los organiza automáticamente por ti.
            </p>
        </div>
      </section>

      {/* ================================
          COLUMNA DERECHA: FORMULARIO
         ================================ */}
      <section className="bg-slate-50 flex justify-center p-6 md:h-screen md:overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Encabezado */}
          <h1 className="text-2xl font-semibold text-slate-900">
            Crear cuenta
          </h1>

          <p className="text-sm text-slate-500 mb-6">
            Completa tus datos para empezar.
          </p>

          {/* Tarjeta del formulario */}
          <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-6 space-y-4">

            {/* Nombre completo */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nombre completo *
              </label>

              <input
                className="
                  mt-1 w-full rounded-lg border border-slate-300 px-3 py-2
                  outline-none focus:ring focus:ring-slate-200
                "
                placeholder="Ej. Carlos Díaz"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Correo */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Correo *
              </label>

              <input
                type="email"
                className="
                  mt-1 w-full rounded-lg border border-slate-300 px-3 py-2
                  outline-none focus:ring focus:ring-slate-200
                "
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Número de celular */}
            <div>
            <label className="block text-sm font-medium text-slate-700">
                Número de celular *
            </label>

            <div className="mt-1 flex items-center gap-2">

                {/* Dropdown custom de país */}
                <div className="relative">
                {/* Botón cerrado: bandera + prefijo */}
                <button
                    type="button"
                    onClick={() => setIsCountryOpen((prev) => !prev)}
                    className="
                    inline-flex items-center gap-2
                    rounded-lg border border-slate-300 bg-slate-50
                    px-3 py-2 text-sm text-slate-700
                    hover:bg-slate-100
                    "
                >
                    <Image
                    src={currentCountry.flagSrc}
                    alt={currentCountry.name}
                    width={20}
                    height={14}
                    className="rounded-sm object-cover"
                    />
                    <span>{currentCountry.dialCode}</span>
                    <span className="text-xs text-slate-500">▼</span>
                </button>

                {/* Lista desplegada: bandera + nombre + prefijo */}
                {isCountryOpen && (
                    <div
                    className="
                        absolute z-10 mt-1 w-48
                        rounded-lg border border-slate-200 bg-white shadow-lg
                    "
                    >
                    {COUNTRY_LIST.map((country) => (
                        <button
                        key={country.id}
                        type="button"
                        onClick={() => {
                            setCurrentCountry(country);
                            setIsCountryOpen(false);
                        }}
                        className="
                            flex w-full items-center justify-between
                            px-3 py-2 text-sm text-slate-700
                            hover:bg-slate-100
                        "
                        >
                        <span className="flex items-center gap-2">
                            <Image
                                src={currentCountry.flagSrc}
                                alt={currentCountry.name}
                                width={20}
                                height={14}
                                className="rounded-sm object-cover"
                                />
                            <span>{country.name}</span>
                        </span>
                        <span className="text-xs text-slate-500">
                            {country.dialCode}
                        </span>
                        </button>
                    ))}
                    </div>
                )}
                </div>

                {/* Input del número SIN prefijo */}
                <input
                type="tel"
                className="
                    flex-1 rounded-lg border border-slate-300 px-3 py-2
                    outline-none focus:ring focus:ring-slate-200 text-sm
                "
                placeholder="300 000 0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                />
            </div>
            </div>



            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Contraseña *
              </label>

              <input
                type="password"
                className="
                  mt-1 w-full rounded-lg border border-slate-300 px-3 py-2
                  outline-none focus:ring focus:ring-slate-200
                "
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Confirmar contraseña *
              </label>

              <input
                type="password"
                className="
                  mt-1 w-full rounded-lg border border-slate-300 px-3 py-2
                  outline-none focus:ring focus:ring-slate-200
                "
                placeholder="Repite la contraseña"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
              />

              {/* Validación visual */}
              {password && password2 && password !== password2 && (
                <p className="mt-1 text-xs text-red-600">
                  Las contraseñas no coinciden.
                </p>
              )}
            </div>
          </div>

          {/* Checkbox + Botón */}
          <div className="mt-6 space-y-4">

            <label className="flex items-start space-x-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="
                  mt-1 h-4 w-4 rounded border-slate-300 text-slate-800
                  focus:ring-slate-400
                "
                required
              />

              <span>
                Acepto los{" "}
                <a href="/terminos" target="_blank" className="underline text-slate-800">
                  Términos y Condiciones
                </a>{" "}
                y la{" "}
                <a href="/privacidad" target="_blank" className="underline text-slate-800">
                  Política de Privacidad
                </a>.
              </span>
            </label>

            {/* Botón principal */}
            <button
              type="submit"
              className="
                w-full rounded-lg py-2.5 font-medium text-white
                bg-gradient-to-r from-brand-700 to-brand-500
                hover:from-brand-600 hover:to-brand-400
                transition
              "
            >
              Crear cuenta
            </button>
          </div>

          {/* Enlace inferior */}
          <p className="text-sm text-slate-600 mt-4 pb-10 text-center">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="underline">
              Inicia sesión
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
