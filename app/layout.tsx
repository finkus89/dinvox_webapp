import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

// Inicializamos la fuente Inter
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dinvox",
  description: "Asistente de registro de gastos por voz.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
