import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Logos } from "@/components/landing/logos";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Metrics } from "@/components/landing/metrics";
import { Testimonial } from "@/components/landing/testimonial";
import { Pricing } from "@/components/landing/pricing";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <Logos />
      <Features />
      <HowItWorks />
      <Metrics />
      <Testimonial />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
