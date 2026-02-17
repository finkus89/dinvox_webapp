// lib/dinvox/categories.ts
// ------------------------
// Configuración de categorías Dinvox (colores)
//
// ✅ ARREGLO (UI):
// - Se añade `emoji` opcional por categoría para mostrarlo en barras/listas
//   sin afectar la BD ni el modelo. Es solo presentación.

export type CategoryId =
  | "comida"
  | "creditos"
  | "educacion"
  | "finanzas"
  | "hogar"
  | "mascotas"
  | "mercado"
  | "ocio"
  | "personales"
  | "regalos"
  | "ropa"
  | "salud"
  | "servicios"
  | "transporte"
  | "otros";

export interface CategoryConfig {
  id: CategoryId;
  label: string;
  color: string;

  // 🆕 Solo para UI (opcional)
  emoji?: string;
}

export const CATEGORIES: Record<CategoryId, CategoryConfig> = {
  personales: {
    id: "personales",
    label: "Artículos personales",
    color: "#a3e635",
    emoji: "🧴",
  },
  comida: {
    id: "comida",
    label: "Comida",
    color: "#f97373",
    emoji: "🍽️",
  },
  creditos: {
    id: "creditos",
    label: "Créditos",
    color: "#6366f1",
    emoji: "💳",
  },
  educacion: {
    id: "educacion",
    label: "Educación",
    color: "#eab308",
    emoji: "🎓",
  },
  finanzas: {
    id: "finanzas",
    label: "Finanzas",
    color: "#a855f7",
    emoji: "📈",
  },
  hogar: {
    id: "hogar",
    label: "Hogar",
    color: "#ec4899",
    emoji: "🏠",
  },
  mascotas: {
    id: "mascotas",
    label: "Mascotas",
    color: "#f97316",
    emoji: "🐾",
  },
  mercado: {
    id: "mercado",
    label: "Mercado",
    color: "#facc15",
    emoji: "🛒",
  },
  ocio: {
    id: "ocio",
    label: "Ocio",
    color: "#2dd4bf",
    emoji: "🎉",
  },
  regalos: {
    id: "regalos",
    label: "Regalos",
    color: "#0ea5e9",
    emoji: "🎁",
  },
  ropa: {
    id: "ropa",
    label: "Ropa",
    color: "#10b981",
    emoji: "👕",
  },
  salud: {
    id: "salud",
    label: "Salud",
    color: "#38bdf8",
    emoji: "🩺",
  },
  servicios: {
    id: "servicios",
    label: "Servicios",
    color: "#22c55e",
    emoji: "🧾",
  },
  transporte: {
    id: "transporte",
    label: "Transporte",
    color: "#fb923c",
    emoji: "🚗",
  },
  otros: {
    id: "otros",
    label: "Otros",
    color: "#9ca3af",
    emoji: "📦",
  },
};

// 👉 Array útil para mapear opciones, sin orden especial garantizado
export const CATEGORIES_ARRAY: CategoryConfig[] = Object.values(CATEGORIES);
