import { Clock, MapPinned, CircleDollarSign, Frown } from 'lucide-react'
import CtaButton from './CtaButton.jsx'
import { useReveal } from '../hooks/useReveal.js'
import './ProblemSection.css'

const PROBLEMS = [
  {
    icon: Clock,
    tone: 'blue',
    title: 'Pierdes tiempo buscando',
    text: 'Das vueltas buscando un espacio disponible.',
  },
  {
    icon: MapPinned,
    tone: 'cyan',
    title: 'No conoces la zona',
    text: 'Llegas a un lugar nuevo y no sabes qué parqueaderos tienes cerca.',
  },
  {
    icon: CircleDollarSign,
    tone: 'amber',
    title: 'No conoces la tarifa',
    text: 'En algunos casos descubres el precio solamente cuando llegas.',
  },
  {
    icon: Frown,
    tone: 'rose',
    title: 'Llegas tarde o estresado',
    text: 'Buscar dónde estacionar puede convertirse en una parte inesperada de tu recorrido.',
  },
]

export default function ProblemSection() {
  const ref = useReveal()

  return (
    <section id="problema" className="section problem" ref={ref}>
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">El problema</span>
          <h2 className="section-title">¿Te ha pasado que llegas a un lugar y no sabes dónde parquear?</h2>
          <p className="section-sub">Una diligencia, una cita o una visita pueden complicarse en los últimos metros.</p>
        </div>

        <div className="problem__grid">
          {PROBLEMS.map(({ icon: Icon, tone, title, text }, i) => (
            <article key={title} className={`problem-card problem-card--${tone} reveal`} style={{ '--delay': `${i * 90}ms` }}>
              <span className="problem-card__icon">
                <Icon size={24} strokeWidth={2.2} aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <div className="section-cta reveal">
          <p>Si te sentiste identificado, esta idea es para ti.</p>
          <CtaButton>Quiero una solución así</CtaButton>
        </div>
      </div>
    </section>
  )
}
