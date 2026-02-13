// lib/dinvox/countries-config.ts

// 🔹 IDs internos de país
export type CountryId = "CO" | "ES" | "US";

// 🔹 Configuración base por país
export interface CountryConfig {
  id: CountryId;
  name: string;
  dialCode: string;
  iso2: string;
  defaultTimezone: string;
  currency: string;
  currencySymbol: string;
  defaultLanguage: string;
  flagSrc: string;
}

// 🔹 Configuración países soportados
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

  ES: {
    id: "ES",
    name: "España",
    dialCode: "+34",
    iso2: "es",
    defaultTimezone: "Europe/Madrid",
    currency: "EUR",
    currencySymbol: "€",
    defaultLanguage: "es-ES",
    flagSrc: "/flags/es.svg",
  },

  US: {
  id: "US",
  name: "Estados Unidos",
  dialCode: "+1",
  iso2: "us",
  defaultTimezone: "America/New_York", // base por defecto (puedes cambiar)
  currency: "USD",
  currencySymbol: "$",
  defaultLanguage: "es-419",
  flagSrc: "/flags/us.svg",
},

};

// 🔹 País por defecto
export const DEFAULT_COUNTRY_ID: CountryId = "CO";

// 🔹 Lista para dropdown
export const COUNTRY_LIST: CountryConfig[] = Object.values(COUNTRIES_CONFIG);
