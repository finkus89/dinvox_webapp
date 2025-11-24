"use client";

/* 
  Página de registro de Dinvox (versión completa con registro real)
  ---------------------------------------------------------------
  - Mantiene 100% tu UI actual sin tocar nada visual.
  - Agrega validaciones, normalizaciones y conexión con Supabase Auth.
  - Manejo de errores por campo y error global.
*/

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

import {
  COUNTRIES_CONFIG,
  COUNTRY_LIST,
  type CountryConfig,
} from "@/lib/dinvox/countries-config";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  // ================================
  // ESTADOS DEL FORMULARIO
  // ================================
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [currentCountry, setCurrentCountry] = useState<CountryConfig>(
    COUNTRIES_CONFIG.CO
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");


  // ================================
  // ERRORES POR CAMPO
  // ================================
  const [errorName, setErrorName] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorPhone, setErrorPhone] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorGeneral, setErrorGeneral] = useState("");
  const [errorTerms, setErrorTerms] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);


  // Limpieza automática al escribir
  const clearErrors = () => {
    setErrorName("");
    setErrorEmail("");
    setErrorPhone("");
    setErrorPassword("");
    setErrorGeneral("");
    setErrorTerms("");
  };

  // ======================================================
  //   FUNCIÓN PRINCIPAL DE REGISTRO (maneja TODO)
  // ======================================================
  const handleRegister = async () => {
    clearErrors();

    // ============================
    // VALIDACIONES — NOMBRE
    // ============================
    if (!name.trim()) {
      setErrorName("El nombre es obligatorio.");
      return;
    }
    if (name.trim().length < 3) {
      setErrorName("El nombre debe tener al menos 3 caracteres.");
      return;
    }

    // Normalizar nombre (minúsculas + trim + espacios simples)
    const normalizedName = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");

    // ============================
    // VALIDACIONES — EMAIL
    // ============================
    if (!email.trim()) {
      setErrorEmail("El correo es obligatorio.");
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(normalizedEmail)) {
      setErrorEmail("Correo inválido.");
      return;
    }

    // ============================
    // VALIDACIONES — TELÉFONO
    // ============================
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (!cleanPhone) {
      setErrorPhone("El número de celular es obligatorio.");
      return;
    }
    if (cleanPhone.length < 7 || cleanPhone.length > 10) {
      setErrorPhone("Número inválido.");
      return;
    }

    const phone_e164 = `${currentCountry.dialCode}${cleanPhone}`;

    // ============================
    // VALIDACIONES — PASSWORD
    // ============================
    if (password.length < 8) {
      setErrorPassword("La contraseña debe tener mínimo 8 caracteres.");
      return;
    }

    if (password !== password2) {
      setErrorPassword("Las contraseñas no coinciden.");
      return;
    }

    // ============================
    // VALIDACIÓN — TÉRMINOS
    // ============================
    if (!termsAccepted) {
      setErrorTerms("Debes aceptar los términos y condiciones.");
      return;
    }
    // ======================================================
    // 1) CREAR USUARIO EN SUPABASE AUTH
    //    + indicar a dónde redirigir el enlace del correo
    // ======================================================
    const origin = window.location.origin; // ej: http://localhost:3000 o https://dinvox-webapp.vercel.app

    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

    if (authError) {
      setErrorGeneral(
        authError.message || "No pudimos crear tu cuenta. Intenta otra vez."
      );
      return;
    }

    const authUserId = authData.user?.id;
    if (!authUserId) {
      setErrorGeneral("No pudimos obtener el usuario. Intenta nuevamente.");
      return;
    }

    // ======================================================
    // 2) INSERTAR PERFIL EXTENDIDO EN TABLA public.users
    // ======================================================
    const { error: insertError } = await supabase
      .from("users")
      .insert({
        auth_user_id: authUserId,
        email: normalizedEmail,
        name: normalizedName,
        phone_country_code: currentCountry.dialCode,
        phone_national: cleanPhone,
        phone_e164,
        channel: "telegram",
        language: currentCountry.defaultLanguage,
          currency: currentCountry.currency,
        terms_accepted_at: new Date().toISOString(),
      });

    if (insertError) {
      setErrorGeneral(
        "Tu cuenta fue creada en Auth, pero no pudimos guardar tu perfil. Contacta soporte."
      );
      return;
    }

    // ======================================================
    // 3) MOSTRAR MENSAJE DE ÉXITO (sin redirigir)
    // ======================================================
    setSuccessMessage(
      "Tu cuenta fue creada. Te enviamos un correo de confirmación. Por favor revisa tu bandeja y confirma tu cuenta antes de iniciar sesión."
    );

    // Opcional: limpiar campos del formulario
    setName("");
    setEmail("");
    setPassword("");
    setPassword2("");
    setPhoneNumber("");
    setTermsAccepted(false);
  };

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
      <section className="bg-slate-200 flex justify-center p-6 md:h-screen md:overflow-y-auto">
        <div className="w-full max-w-md">

          <h1 className="text-2xl font-semibold text-slate-900">
            Crear cuenta
          </h1>

          <p className="text-sm text-slate-500 mb-6">
            Completa tus datos para empezar.
          </p>

          {/* Error general */}
          {errorGeneral && (
            <p className="text-red-600 text-sm mb-3">{errorGeneral}</p>
          )}
          {/* Mensaje de éxito */}
          {successMessage && (
            <p className="text-green-700 bg-green-100 border border-green-300 px-3 py-2 rounded-md text-sm mb-4">
              {successMessage}
            </p>
          )}


          {/* Tarjeta */}
          <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-6 space-y-4">

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nombre completo *
              </label>

              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring focus:ring-slate-200"
                placeholder="Ej. Carlos Díaz"
                value={name}
                onChange={(e) => {
                  clearErrors();
                  setName(e.target.value);
                }}
              />

              {errorName && (
                <p className="mt-1 text-xs text-red-600">{errorName}</p>
              )}
            </div>

            {/* Correo */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Correo *
              </label>

              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring focus:ring-slate-200"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => {
                  clearErrors();
                  setEmail(e.target.value);
                }}
              />

              {errorEmail && (
                <p className="mt-1 text-xs text-red-600">{errorEmail}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Número de celular *
              </label>

              <div className="mt-1 flex items-center gap-2">

                {/* Dropdown país */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCountryOpen((p) => !p)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
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

                  {isCountryOpen && (
                    <div className="absolute z-10 mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
                      {COUNTRY_LIST.map((country) => (
                        <button
                          key={country.id}
                          type="button"
                          onClick={() => {
                            setIsCountryOpen(false);
                            clearErrors();
                            setCurrentCountry(country);
                          }}
                          className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <span className="flex items-center gap-2">
                            <Image
                              src={country.flagSrc}
                              alt={country.name}
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

                {/* Input número */}
                <input
                  type="tel"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring focus:ring-slate-200 text-sm"
                  placeholder="300 000 0000"
                  value={phoneNumber}
                  onChange={(e) => {
                    clearErrors();
                    setPhoneNumber(e.target.value);
                  }}
                />
              </div>

              {errorPhone && (
                <p className="mt-1 text-xs text-red-600">{errorPhone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Contraseña *
              </label>

              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring focus:ring-slate-200"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => {
                  clearErrors();
                  setPassword(e.target.value);
                }}
              />

              {errorPassword && (
                <p className="mt-1 text-xs text-red-600">{errorPassword}</p>
              )}
            </div>

            {/* Confirmar password */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Confirmar contraseña *
              </label>

              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring focus:ring-slate-200"
                placeholder="Repite la contraseña"
                value={password2}
                onChange={(e) => {
                  clearErrors();
                  setPassword2(e.target.value);
                }}
              />

              {password && password2 && password !== password2 && (
                <p className="mt-1 text-xs text-red-600">
                  Las contraseñas no coinciden.
                </p>
              )}
            </div>
          </div>

          {/* Checkbox + Botón */}
          <div className="mt-6 space-y-4">

            {/* Términos */}
            <label className="flex items-start space-x-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="
                  mt-1 h-4 w-4 rounded border-slate-300 text-slate-800
                  focus:ring-slate-400
                "
                checked={termsAccepted}
                onChange={(e) => {
                  clearErrors();
                  setTermsAccepted(e.target.checked);
                }}
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

            {errorTerms && (
              <p className="mt-1 text-xs text-red-600">{errorTerms}</p>
            )}

            {/* Botón principal */}
            <button
              onClick={handleRegister}
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
