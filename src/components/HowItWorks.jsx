import { Flag, Search, Info, Bookmark, ParkingSquare, Lightbulb } from 'lucide-react'
import { useReveal } from '../hooks/useReveal.js'
import './HowItWorks.css'

const STEPS = [
  { icon: Flag, title: 'Tu destino', text: 'Indicas a dónde vas.' },
  { icon: Search, title: 'Encuentra opciones', text: 'Ves parqueaderos cerca.' },
  { icon: Info, title: 'Consulta información', text: 'Ubicación, disponibilidad y tarifa.' },
  { icon: Bookmark, title: 'Aparta tu espacio', text: 'Eliges dónde dejar tu vehículo.' },
  { icon: ParkingSquare, title: 'Llega y estaciona', text: 'Sin dar vueltas.' },
]

export default function HowItWorks() {
  const ref = useReveal()

  return (
    <section id="como-funciona" className="section section--dark how" ref={ref}>
      <div className="container">
        <div className="how__intro">
          <div className="reveal">
            <span className="eyebrow">La idea</span>
            <h2 className="section-title">
              Conoce <span className="text-gradient">ApartaTuEspacio</span>
            </h2>
          </div>
          <div className="reveal" style={{ '--delay': '120ms' }}>
            <p className="how__lead">
              Una idea que busca facilitar la forma en que encuentras dónde estacionar. Queremos conectar a conductores
              con espacios de parqueadero disponibles, con información para planificar dónde dejar tu vehículo{' '}
              <strong>antes de llegar a tu destino.</strong>
            </p>
            <div className="how__equation">
              <span>Personas que necesitan estacionar</span>
              <b aria-hidden="true">+</b>
              <span>Espacios de parqueadero disponibles</span>
            </div>
          </div>
        </div>

        <ol className="how__steps">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="how-step reveal" style={{ '--delay': `${i * 110}ms` }}>
              <span className="how-step__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="how-step__icon">
                <Icon size={24} aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>

        <p className="how__note reveal">
          <Lightbulb size={18} aria-hidden="true" />
          Así imaginamos la experiencia. Aún estamos validando la idea y tu opinión nos ayudará a definirla.
        </p>
      </div>
    </section>
  )
}
