// webapp/lib/mock/summary-mock.ts
// -------------------------------------------------------
// Mock de datos consolidados EXACTAMENTE como los recibirá
// SummaryCard desde el hook real (expenses-summary.ts).
// -------------------------------------------------------

import type { CategoryId } from "@/lib/dinvox/categories";

export interface SummaryCategory {
  categoryId: CategoryId;
  amount: number;
  percent: number; // 0–100, ya calculado
}

export interface SummaryData {
  total: number;
  currency: string;
  categories: SummaryCategory[];
}

// -----------------------------------------
// MOCK COMPLETO con TODAS las categorías
// -----------------------------------------

export const MOCK_SUMMARY_DATA: SummaryData = {
  // suma real de todos los amount
  total: 2_770_000,
  currency: "COP",
  categories: [
    { categoryId: "comida",     amount: 650_000, percent: 23.5 },
    { categoryId: "mercado",    amount: 420_000, percent: 15.2 },
    { categoryId: "transporte", amount: 380_000, percent: 13.7 },
    { categoryId: "servicios",  amount: 310_000, percent: 11.2 },
    { categoryId: "ocio",       amount: 210_000, percent: 7.6 },
    { categoryId: "salud",      amount: 165_000, percent: 6.0 },
    { categoryId: "creditos",   amount: 145_000, percent: 5.2 },
    { categoryId: "hogar",      amount: 110_000, percent: 4.0 },
    { categoryId: "finanzas",   amount: 90_000,  percent: 3.2 },
    { categoryId: "educacion",  amount: 75_000,  percent: 2.7 },
    { categoryId: "ropa",       amount: 60_000,  percent: 2.2 },
    { categoryId: "regalos",    amount: 55_000,  percent: 2.0 },
    { categoryId: "personales", amount: 50_000,  percent: 1.8 },
    { categoryId: "mascotas",   amount: 35_000,  percent: 1.3 },
    { categoryId: "otros",      amount: 15_000,  percent: 0.5 },
  ],
};
