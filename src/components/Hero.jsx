import { Sparkles, ShieldCheck, Clock3 } from 'lucide-react'
import CtaButton from './CtaButton.jsx'
import HeroVisual from './HeroVisual.jsx'
import { scrollToId } from '../hooks/scrollTo.js'
import './Hero.css'

export default function Hero() {
  const goHowItWorks = (event) => {
    event.preventDefault()
    scrollToId('como-funciona')
  }

  return (
    <section id="inicio" className="hero">
      <div className="hero__grid-bg" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__copy">
          <span className="hero__badge">
            <span className="hero__badge-dot" aria-hidden="true" />
            Idea en validación · Únete a los primeros
          </span>

          <h1 className="hero__title">
            Encuentra dónde parquear <span className="text-gradient">antes de llegar.</span>
          </h1>

          <p className="hero__sub">
            Deja de perder tiempo buscando dónde estacionar. <strong>ApartaTuEspacio</strong> busca ayudarte a encontrar
            opciones de parqueadero para tu carro o moto antes de llegar a tu destino.
          </p>

          <div className="hero__actions">
            <CtaButton />
            <a href="#como-funciona" onClick={goHowItWorks} className="btn btn--ghost btn--lg">
              Ver la idea
            </a>
          </div>

          <ul className="hero__trust">
            <li>
              <Sparkles size={16} aria-hidden="true" /> Registro gratuito
            </li>
            <li>
              <Clock3 size={16} aria-hidden="true" /> Solo 3 datos
            </li>
            <li>
              <ShieldCheck size={16} aria-hidden="true" /> Sin compromiso
            </li>
          </ul>
        </div>

        <div className="hero__visual">
          <HeroVisual />
        </div>
      </div>
    </section>
  )
}
