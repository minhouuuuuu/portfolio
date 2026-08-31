import { Navbar } from '@/components/layout/Navbar'
import { Hero } from '@/components/sections/Hero'
import { About } from '@/components/sections/About'
import { Projects } from '@/components/sections/Projects'
import { LabSection } from '@/components/lab/LabSection'
import { MarqueeText } from '@/components/ui/MarqueeText'
import { Contact } from '@/components/sections/Contact'
import { ScrollDepthTracker } from '@/components/analytics/ScrollDepthTracker'

export default function Home() {
  return (
    <main>
      <ScrollDepthTracker />
      <Navbar />
      <Hero />
      <MarqueeText
        text="PRODUCT ENGINEERING · NEXT.JS · TYPESCRIPT · SYSTEM DESIGN · SHIPPED TO PRODUCTION · PRODUCT ENGINEERING · NEXT.JS · TYPESCRIPT · SYSTEM DESIGN · SHIPPED TO PRODUCTION · "
        direction="left"
      />
      <Projects />
      <About />
      <LabSection />
      <Contact />
    </main>
  )
}
