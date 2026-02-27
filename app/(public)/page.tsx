import LandingHeader from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
// ... lo demás

export default function LandingPage() {
  return (
    <main className="w-full">
      <LandingHeader />
      <Hero />
      {/* resto */}
    </main>
  );
}