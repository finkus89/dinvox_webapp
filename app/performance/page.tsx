// src/app/performance/page.tsx
// pagina de performance q mostrara los insigths y analisis y el desempeño de los gastos

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { logOut } from "@/lib/supabase/logout";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import PageContainer from "@/components/layout/PageContainer";
import PeriodFilter, {
  AnalysisPeriodValue,
} from "@/components/filters/PeriodFilter";
import { Accordion } from "@/components/layout/Accordion";
import AccordionSection from "@/components/layout/AccordionSection";
import { BarChart3, Activity, PieChart, TrendingUp, LineChart, Repeat, } from "lucide-react";
import MonthThirdsCard from "@/components/performance/MonthThirdsCard";
import MonthRhythmCard from "@/components/performance/MonthRhythmCard";
import MonthlyEvolutionCard from "@/components/performance/MonthlyEvolutionCard";


// 🔹 Datos reales del usuario desde la BD
interface DBUser {
  name: string;
  currency: string;
  language: string;
}

// 🔹 Helper para formatear el nombre en “Title Case”
function formatName(raw: string): string {
  return raw
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join(" ");
}

//secciones q muestra cada filtro dle periodo
const PERFORMANCE_SECTIONS_BY_PERIOD: Record<
  AnalysisPeriodValue,
  string[]
> = {
  current_month: [
    "monththirds",
    "rhythm",
    "distribution",
    "projection",
  ],
  previous_month: [
    "monththirds",
    "rhythm",
    "distribution",
  ],
  last_12_months: [
    "evolution",
    "patterns",
  ],
  last_6_months: [
    "evolution",
    "patterns",
  ],
  year_to_date: [
    "evolution",
    "patterns",
  ],
};


export default function PerformancePage() {
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // 🔹 Carga de usuario desde Supabase
  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("users")
        .select("name, currency, language")
        .eq("auth_user_id", session.user.id)
        .single();

      if (!error && data) {
        setDbUser(data);
      }
    }

    loadUser();
  }, [supabase]);

  // 🔹 Logout
  const handleLogout = async () => {
    await logOut();
    router.replace("/login");
  };

  // 🔹 Nombre e info para header/sidebar
  const rawName = dbUser?.name ?? "";
  const displayName = rawName ? formatName(rawName) : "";
  // Comentario: si en la BD ya guardas "es-co", aquí simplemente lo mostramos
  const languageDisplay = (dbUser?.language ?? "es-co").toUpperCase();
  const currencyDisplay = (dbUser?.currency ?? "COP").toUpperCase();
  //para el filtro de lso periodos
  const [period, setPeriod] =
  useState<AnalysisPeriodValue>("current_month");
  //para las secciones q muestra segun filtro
  const visibleSections =
  PERFORMANCE_SECTIONS_BY_PERIOD[period]

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden">
      {/* =============== SIDEBAR DESKTOP (FIJO) =============== */}
      <aside
        className="
          hidden md:flex flex-col w-64
          bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-900
          text-slate-100
          h-full
        "
      >
        <Sidebar
          userName={displayName}
          showCloseButton={false}
          onCloseMobileSidebar={undefined}
          onLogout={handleLogout}
        />
      </aside>

      {/* =============== SIDEBAR MÓVIL (DRAWER) =============== */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Fondo semitransparente para cerrar al hacer clic fuera */}
          <button
            type="button"
            className="flex-1 bg-black/40"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Cerrar menú lateral"
          />
          {/* Panel lateral móvil */}
          <div className="relative w-64 max-w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-900 text-slate-100 shadow-xl">
            <Sidebar
              userName={displayName}
              showCloseButton
              onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* =============== ZONA PRINCIPAL (HEADER + CONTENIDO) =============== */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* HEADER reutilizable */}
        <Header
          displayName={displayName}
          language={languageDisplay}
          currency={currencyDisplay}
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          title="Desempeño del gasto"
        />

        {/* CONTENIDO PRINCIPAL usando PageContainer */}
        <PageContainer>
          {/* Filtro dde periodo */}
          <div className="mb-6 max-w-xs">
            <PeriodFilter
              mode="analysis"
              value={period}
              onChange={setPeriod}
            />
          </div>

          {/* Secciones segun filtro  */}
          <Accordion defaultOpenKey={visibleSections[0]}>
            
            {/* tercios */}
            {visibleSections.includes("monththirds") && (
              <AccordionSection
                sectionKey="monththirds"
                title="Tercios del mes"
                icon={<BarChart3 className="h-5 w-5 text-slate-200" />}
              >
                {(period === "current_month" || period === "previous_month") && (
                  <MonthThirdsCard
                    period={period}
                    embedded
                    fallbackCurrency={currencyDisplay}
                  />
                )}
              </AccordionSection>
            )}

            {/* ritmo*/}
            {visibleSections.includes("rhythm") && (
              <AccordionSection
                sectionKey="rhythm"
                title="Ritmo del mes"
                icon={<Activity className="h-5 w-5 text-slate-200" />}
              >
                {(period === "current_month" || period === "previous_month") && (
                  <MonthRhythmCard
                    period={period}
                    embedded
                    fallbackCurrency={currencyDisplay}
                  />
                )}
              </AccordionSection>
            )}

            {/* distribucion 
            {visibleSections.includes("distribution") && (
              <AccordionSection
                sectionKey="distribution"
                title="Distribución del gasto"
                icon={<PieChart className="h-5 w-5 text-slate-200" />}
              >
                <div className="text-white/80">
                  Próximo: concentración vs distribución.
                </div>
              </AccordionSection>
            )} */}

            {/* evolucion */}
            {visibleSections.includes("evolution") &&
              (period === "last_6_months" ||
              period === "last_12_months" ||
              period === "year_to_date") && (
              <AccordionSection
                sectionKey="evolution"
                title="Evolución mensual"
                icon={<LineChart className="h-5 w-5 text-slate-200" />}
              >
                <MonthlyEvolutionCard
                  period={period}
                  embedded
                  fallbackCurrency={currencyDisplay}
                />
              </AccordionSection>
            )}

            {/* patrones
            {visibleSections.includes("patterns") && (
              <AccordionSection
                sectionKey="patterns"
                title="Patrones del gasto"
                icon={<Repeat className="h-5 w-5 text-slate-200" />}
              >
                <div className="text-white/80">
                  Próximo: patrones recurrentes.
                </div>
              </AccordionSection>
            )} */}
          </Accordion>

        </PageContainer>
      
      </div>
    </div>
  );
}
