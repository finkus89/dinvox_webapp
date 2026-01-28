// lib/dinvox/categories.ts
// ------------------------
// Configuración de categorías Dinvox (colores)

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
}

export const CATEGORIES: Record<CategoryId, CategoryConfig> = {
  personales: {
    id: "personales",
    label: "Artículos personales",
    color: "#a3e635",
  },
  comida: {
    id: "comida",
    label: "Comida",
    color: "#f97373",
  },
  creditos: {
    id: "creditos",
    label: "Créditos",
    color: "#6366f1",
  },
  educacion: {
    id: "educacion",
    label: "Educación",
    color: "#eab308",
  },
  finanzas: {
    id: "finanzas",
    label: "Finanzas",
    color: "#a855f7",
  },
  hogar: {
    id: "hogar",
    label: "Hogar",
    color: "#ec4899",
  },
  mascotas: {
    id: "mascotas",
    label: "Mascotas",
    color: "#f97316",
  },
  mercado: {
    id: "mercado",
    label: "Mercado",
    color: "#facc15",
  },
  ocio: {
    id: "ocio",
    label: "Ocio",
    color: "#2dd4bf",
  },
  regalos: {
    id: "regalos",
    label: "Regalos",
    color: "#0ea5e9",
  },
  ropa: {
    id: "ropa",
    label: "Ropa",
    color: "#10b981",
  },
  salud: {
    id: "salud",
    label: "Salud",
    color: "#38bdf8",
  },
  servicios: {
    id: "servicios",
    label: "Servicios",
    color: "#22c55e",
  },
  transporte: {
    id: "transporte",
    label: "Transporte",
    color: "#fb923c",
  },
  otros: {
    id: "otros",
    label: "Otros",
    color: "#9ca3af",
  },
};


// 👉 Array útil para mapear opciones, sin orden especial garantizado
export const CATEGORIES_ARRAY: CategoryConfig[] = Object.values(CATEGORIES);
