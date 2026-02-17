"use client";

/*
C:\Users\queva\Documents\dinvox\webapp\lib\auth\form-helpers.ts
  form-helpers.ts
  ----------------
  Helpers reutilizables para formularios de autenticación:

  - runSubmit: controla loading + evita doble envío.
  - normalizeEmail: limpia y estandariza email.
  - isValidEmail: valida formato.
*/

export async function runSubmit(
  isSubmitting: boolean,
  setIsSubmitting: (v: boolean) => void,
  fn: () => Promise<void>
) {
  if (isSubmitting) return;

  setIsSubmitting(true);

  try {
    await fn();
  } finally {
    setIsSubmitting(false);
  }
}

// ==========================
// Email helpers
// ==========================

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  const emailRegex = /\S+@\S+\.\S+/;
  return emailRegex.test(email);
}
