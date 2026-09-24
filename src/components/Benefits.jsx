import { Timer, MapPin, CircleDollarSign, Map, Smile } from 'lucide-react'
import CtaButton from './CtaButton.jsx'
import { useReveal } from '../hooks/useReveal.js'
import './Benefits.css'

const BENEFITS = [
  { icon: Timer, title: 'Ahorrar tiempo', text: 'Menos tiempo buscando dónde estacionar.' },
  { icon: MapPin, title: 'Opciones cerca', text: 'Encontrar alternativas cerca de tu destino.' },
  { icon: CircleDollarSign, title: 'Tarifas más claras', text: 'Tener mayor claridad sobre lo que vas a pagar.' },
  { icon: Map, title: 'Planificar antes', text: 'Saber dónde estacionar antes de salir.' },
  { icon: Smile, title: 'Menos estrés', text: 'Llegar con más tranquilidad a tu destino.' },
]

export default function Benefits() {
  const ref = useReveal()

  return (
    <section id="beneficios" className="section benefits" ref={ref}>
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Beneficios</span>
          <h2 className="section-title">
            Menos vueltas.
            <br />
            Más tiempo para lo que importa.
          </h2>
          <p className="section-sub">Esto es lo que ApartaTuEspacio busca ofrecerte:</p>
        </div>

        <ul className="benefits__grid">
          {BENEFITS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="benefit reveal" style={{ '--delay': `${i * 80}ms` }}>
              <span className="benefit__icon">
                <Icon size={22} aria-hidden="true" />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
          <li className="benefit benefit--cta reveal" style={{ '--delay': `${BENEFITS.length * 80}ms` }}>
            <h3>¿Te gustaría tener esto?</h3>
            <p>Ayúdanos a validar la idea.</p>
            <CtaButton size="sm">Quiero conocerla</CtaButton>
          </li>
        </ul>

        <p className="benefits__note reveal">
          * Son los beneficios que la idea busca ofrecer; aún no son resultados comprobados.
        </p>
      </div>
    </section>
  )
}
