import { LoaderWrapper } from '@/components/ui/LoaderWrapper'
import { Navbar } from '@/components/layout/Navbar'
import { Hero } from '@/components/sections/Hero'
import { About } from '@/components/sections/About'
import { Services } from '@/components/sections/Services'
import { Projects } from '@/components/sections/Projects'
import { LabSection } from '@/components/lab/LabSection'
import { MarqueeText } from '@/components/ui/MarqueeText'
import { Contact } from '@/components/sections/Contact'

export default function Home() {
  return (
    <LoaderWrapper>
    <main>
      <Navbar />
      <Hero />
      <MarqueeText
        text="CREATIVE DEVELOPER · NEXT JS · GSAP · THREE.JS · FRAMER MOTION · OPEN TO WORK · CREATIVE DEVELOPER · NEXT JS · GSAP · THREE.JS · FRAMER MOTION · OPEN TO WORK · "
        direction="left"
      />
      <About />
      <MarqueeText
        text="REACT · TYPESCRIPT · ANIMATION · INTERACTION · DESIGN · CODE · CRAFT · REACT · TYPESCRIPT · ANIMATION · INTERACTION · DESIGN · CODE · CRAFT · "
        direction="right"
      />
      <Services />
      <MarqueeText
        text="PROJECTS · SHOWCASE · WORK · PORTFOLIO · CASE STUDIES · EXPERIMENTS · PROJECTS · SHOWCASE · WORK · PORTFOLIO · CASE STUDIES · EXPERIMENTS · "
        direction="left"
      />
      <Projects />
      <MarqueeText
        text="EXPERIMENTS · WEBGL · MATTER.JS · SIMPLEX NOISE · CANVAS · INTERACTIVE · EXPERIMENTS · WEBGL · MATTER.JS · SIMPLEX NOISE · CANVAS · INTERACTIVE · "
        direction="right"
      />
      <LabSection />
      <Contact />
    </main>
    </LoaderWrapper>
  )
}
