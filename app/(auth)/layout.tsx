// app/(auth)/layout.tsx
//<div className="min-h-screen w-full bg-gradient-to-br from-slate-800 via-slate-700 to-brand-700">

import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-700 via-slate-600 to-brand-500">
      {children}
    </div>
  );
}