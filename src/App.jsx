import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import ProblemSection from './components/ProblemSection.jsx'
import HowItWorks from './components/HowItWorks.jsx'
import Audience from './components/Audience.jsx'
import Benefits from './components/Benefits.jsx'
import JoinSection from './components/JoinSection.jsx'
import Footer from './components/Footer.jsx'
import MobileCta from './components/MobileCta.jsx'
import { useEffect } from 'react'
import { initAnalytics } from './services/analytics.js'
import { FORM_ID } from './hooks/scrollTo.js'

export default function App() {
  useEffect(() => initAnalytics(FORM_ID), [])

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <Audience />
        <Benefits />
        <JoinSection />
      </main>
      <Footer />
      <MobileCta />
    </>
  )
}
