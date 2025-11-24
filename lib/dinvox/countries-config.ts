// lib/dinvox/countries-config.ts

// 🔹 IDs internos de país (fáciles de extender)
export type CountryId = "CO"; // luego agregas "MX" | "AR" | "US" | etc.

// 🔹 Configuración base por país
export interface CountryConfig {
  id: CountryId;           // Código interno del país
  name: string;            // Nombre visible (para el dropdown)
  dialCode: string;        // Indicativo telefónico (+57)
  iso2: string;            // ISO-2 (para banderas o librerías externas)
  defaultTimezone: string; // Zona horaria principal
  currency: string;        // Código de moneda (ISO 4217) -> "COP"
  currencySymbol: string;  // Símbolo visual -> "$"
  defaultLanguage: string; // Idioma principal -> "es-CO"
  flagSrc: string;       // Opcional, para mostrar banderita en el dropdown
}

// 🔹 MVP: solo Colombia, pero ya con todos los campos listos
export const COUNTRIES_CONFIG: Record<CountryId, CountryConfig> = {
  CO: {
    id: "CO",
    name: "Colombia",
    dialCode: "+57",
    iso2: "co",
    defaultTimezone: "America/Bogota",
    currency: "COP",
    currencySymbol: "$",
    defaultLanguage: "es-CO",
    flagSrc: "/flags/co.svg",
  },
};

// 🔹 País por defecto (útil en register)
export const DEFAULT_COUNTRY_ID: CountryId = "CO";

// 🔹 Lista ya “aplanada” para usar en un <select> o combobox
export const COUNTRY_LIST: CountryConfig[] = Object.values(COUNTRIES_CONFIG);
