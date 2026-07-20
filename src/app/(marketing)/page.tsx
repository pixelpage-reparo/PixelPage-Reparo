import { BonusSection } from "@/components/landing/BonusSection"
import { ComparisonTable } from "@/components/landing/ComparisonTable"
import { FaqAccordion } from "@/components/landing/FaqAccordion"
import { FeatureShowcase } from "@/components/landing/FeatureShowcase"
import { FinalCta } from "@/components/landing/FinalCta"
import { Footer } from "@/components/landing/Footer"
import { GuaranteeSection } from "@/components/landing/GuaranteeSection"
import { Header } from "@/components/landing/Header"
import { Hero } from "@/components/landing/Hero"
import { MarqueeStrip } from "@/components/landing/MarqueeStrip"
import { MultiDeviceSection } from "@/components/landing/MultiDeviceSection"
import { PainSection } from "@/components/landing/PainSection"
import { PricingSection } from "@/components/landing/PricingSection"
import { SupportCta } from "@/components/landing/SupportCta"
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel"

export default function LandingPage() {
  return (
    <div className="bg-background min-h-svh">
      <Header />
      <main>
        <Hero />
        <MarqueeStrip />
        <PainSection />
        <TestimonialsCarousel />
        <FeatureShowcase />
        <ComparisonTable />
        <MultiDeviceSection />
        <PricingSection />
        <BonusSection />
        <GuaranteeSection days={7} />
        <FaqAccordion />
        <SupportCta />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
