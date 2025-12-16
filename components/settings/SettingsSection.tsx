// src/components/settings/SettingsSection.tsx
// -------------------------------------------
// Sección colapsable genérica para Settings.
// - UI pura (sin estado interno).
// - El estado (open/collapse) lo controla SettingsAccordion.

"use client";

import { ChevronDown } from "lucide-react";

type SettingsSectionProps = {
  sectionKey: string; 
  title: string;
  isOpen?: boolean;
  icon?: React.ReactNode;
  onToggle?: () => void;
  children: React.ReactNode;
};

export default function SettingsSection({
  title,
  isOpen = false,
  icon,
  onToggle,
  children,
}: SettingsSectionProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-700 via-slate-600 to-brand-500 backdrop-blur-xl shadow-xl text-slate-100">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="inline-flex items-center justify-center">
              {icon}
            </span>
          )}
          <span className="text-lg font-semibold">{title}</span>
        </div>

        <span
          className="
            inline-flex items-center justify-center
            h-9 w-9 rounded-xl
            border border-white/10
            bg-slate-900/25
            transition-transform
          "
        >
          <ChevronDown
            className={`h-4 w-4 text-slate-200 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>

      </button>

      {isOpen && (
        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="mb-4 h-px bg-white/10" />
          {children}
        </div>
      )}
    </div>
  );
}
