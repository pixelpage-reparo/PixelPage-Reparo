import { Header } from "@/components/landing/Header"
import { Hero } from "@/components/landing/Hero"
import { MarqueeStrip } from "@/components/landing/MarqueeStrip"
import { PainSection } from "@/components/landing/PainSection"
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel"
import { FeatureShowcase } from "@/components/landing/FeatureShowcase"
import { ComparisonTable } from "@/components/landing/ComparisonTable"
import { MultiDeviceSection } from "@/components/landing/MultiDeviceSection"
import { PricingSection } from "@/components/landing/PricingSection"
import { BonusSection } from "@/components/landing/BonusSection"
import { GuaranteeSection } from "@/components/landing/GuaranteeSection"
import { FaqAccordion } from "@/components/landing/FaqAccordion"
import { SupportCta } from "@/components/landing/SupportCta"
import { FinalCta } from "@/components/landing/FinalCta"
import { Footer } from "@/components/landing/Footer"

function LandingPage() {
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

export default LandingPage
