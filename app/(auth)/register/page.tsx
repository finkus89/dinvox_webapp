"use client";

/*
  Página de registro de Dinvox (registro real)
  --------------------------------------------
  Qué hace esta pantalla:
  - Crea el usuario en Supabase Auth (email + password).
  - Guarda datos de perfil en Auth como user_metadata (auth.users.raw_user_meta_data).
    Ej: name, phone_e164, channel, currency, timezone, etc.

  Importante (flujo de Dinvox hoy):
  - Esta pantalla NO crea la fila en public.users.
  - La fila en public.users se crea en el PRIMER LOGIN (ver LoginPage):
    - Ahí se lee user.user_metadata y se inserta la fila en public.users.
    - Por eso, lo que guardemos aquí en user_metadata (como channel) luego se copia a la BD.

  Cambio nuevo en esta versión:
  - Se agrega selector de CANAL (WhatsApp / Telegram) debajo del celular.
  - El canal seleccionado se guarda en user_metadata.channel (antes estaba fijo en "telegram").
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

// 🆕 Helpers para evitar duplicación y bugs de submit
import { runSubmit, normalizeEmail, isValidEmail } from "@/lib/auth/form-helpers";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🆕 Canal elegido (se guarda en user_metadata.channel)
  // Nota: dejamos default en "telegram" por continuidad con el flujo actual.
  const [channel, setChannel] = useState<"telegram" | "whatsapp">("whatsapp");

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
    // --------------------------------------------------
    // ✅ ARREGLO (bug "se queda cargando"):
    // - Validamos primero (sin loading).
    // - runSubmit se encarga del lock + loading + finally.
    // --------------------------------------------------
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
    const normalizedName = name.toLowerCase().trim().replace(/\s+/g, " ");

    // ============================
    // VALIDACIONES — EMAIL
    // ============================
    if (!email.trim()) {
      setErrorEmail("El correo es obligatorio.");
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
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
    // SUBMIT (con lock + loading garantizado)
    // ======================================================
    await runSubmit(isSubmitting, setIsSubmitting, async () => {
      // ======================================================
      // 1) CREAR USUARIO EN SUPABASE AUTH
      // ======================================================
      const origin = window.location.origin;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            // 👇 Todo esto queda en auth.users.raw_user_meta_data (user_metadata)
            name: normalizedName,
            phone_country_code: currentCountry.dialCode,
            phone_national: cleanPhone,
            phone_e164,

            // 🆕 Guardar canal elegido (antes estaba fijo en "telegram")
            channel,

            language: currentCountry.defaultLanguage,
            currency: currentCountry.currency,
            timezone: currentCountry.defaultTimezone,
            terms_accepted_at: new Date().toISOString(),
          },
        },
      });

      if (authError) {
        const rawMsg = (authError.message || "").toLowerCase();

        if (rawMsg.includes("already registered") || rawMsg.includes("already exists")) {
          // correo ya usado en Auth
          setErrorEmail("Ya existe una cuenta con este correo. Intenta iniciar sesión.");
        } else {
          setErrorGeneral(authError.message || "No se pudo crear la cuenta. Inténtalo de nuevo.");
        }
        return;
      }

      const authUserId = authData.user?.id;
      if (!authUserId) {
        setErrorGeneral("No se pudo obtener el usuario después del registro.");
        return;
      }

      // ======================================================
      // 3) MOSTRAR MENSAJE DE ÉXITO (sin redirigir)
      // ======================================================
      setSuccessMessage(
        "Tu cuenta fue creada. Te enviamos un correo de confirmación. Por favor revisa tu bandeja de entrada o correos no deseados y confirma tu cuenta antes de iniciar sesión."
      );

      // Opcional: limpiar campos del formulario
      setName("");
      setEmail("");
      setPassword("");
      setPassword2("");
      setPhoneNumber("");
      setTermsAccepted(false);

      // Nota: No reseteamos channel para mantener la elección si vuelve a registrarse.
    });
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
          <h2 className="text-3xl font-semibold mb-3">Registrate en Dinvox</h2>

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
      <section className="bg-slate-200 flex justify-center p-5 md:h-screen md:overflow-y-auto">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold text-slate-900">Crear cuenta</h1>

          <p className="text-sm text-slate-500 mb-3">
            Completa tus datos para empezar.
          </p>

          {/* Error general */}
          {errorGeneral && (
            <p className="text-red-600 text-sm mb-3">{errorGeneral}</p>
          )}

          {/* Mensaje de éxito */}
          {successMessage && (
            <p className="text-green-700 bg-green-100 border border-green-300 px-3 py-1.5 rounded-md text-sm mb-4">
              {successMessage}
            </p>
          )}

          {/* Tarjeta */}
          <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-6 space-y-3">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nombre completo *
              </label>

              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 outline-none focus:ring focus:ring-slate-200"
                placeholder="Ej. Carlos Díaz"
                value={name}
                maxLength={80}
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
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 outline-none focus:ring focus:ring-slate-200"
                placeholder="ejemplo@correo.com"
                value={email}
                maxLength={254}
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
                    className="inline-flex items-center gap- rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
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
                          className="flex w-full items-center justify-between px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
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
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 outline-none focus:ring focus:ring-slate-200 text-sm"
                  placeholder="300 000 0000"
                  value={phoneNumber}
                  maxLength={15}
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

            {/* 🆕 Canal (debajo del celular) */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Canal de uso *
              </label>

              <div className="mt-1 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearErrors();
                    setChannel("whatsapp");
                  }}
                  className={`
                    rounded-lg border px-3 py-1.5 text-sm font-medium transition
                    ${
                      channel === "whatsapp"
                        ? "border-slate-500 bg-slate-200 text-slate-900 ring-1 ring-slate-400"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }
                  `}
                >
                  WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => {
                    clearErrors();
                    setChannel("telegram");
                  }}
                  className={`
                    rounded-lg border px-3 py-1.5 text-sm font-medium transition
                    ${
                      channel === "telegram"
                        ? "border-slate-500 bg-slate-200 text-slate-900 ring-1 ring-slate-400"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }
                  `}
                >
                  Telegram
                </button>
              </div>

              <p className="mt-1 text-[11px] text-slate-500">
                La conexión se realiza en tu primer login.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Contraseña *
              </label>

              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 outline-none focus:ring focus:ring-slate-200"
                placeholder="Mínimo 8 caracteres"
                value={password}
                maxLength={128}
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
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 outline-none focus:ring focus:ring-slate-200"
                placeholder="Repite la contraseña"
                value={password2}
                maxLength={128}
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
          <div className="mt-4 space-y-3">
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
                <a
                  href="/legal#terminos"
                  target="_blank"
                  className="underline text-slate-800"
                >
                  Términos y Condiciones
                </a>{" "}
                y la{" "}
                <a
                  href="/legal#privacidad"
                  target="_blank"
                  className="underline text-slate-800"
                >
                  Política de Privacidad
                </a>
                .
              </span>
            </label>

            {errorTerms && (
              <p className="mt-1 text-xs text-red-600">{errorTerms}</p>
            )}

            {/* Botón principal */}
            <button
              onClick={handleRegister}
              disabled={isSubmitting}
              className={`
                w-full rounded-lg py-2 font-medium text-white
                bg-gradient-to-r from-brand-700 to-brand-500
                hover:from-brand-600 hover:to-brand-400
                transition
                ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}
              `}
            >
              {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
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
