import { useReveal } from '../hooks/useReveal.js'
import './Audience.css'

const AUDIENCE = [
  {
    emoji: '🚗',
    title: 'Conductores de carro',
    text: 'Necesitas parqueadero cuando visitas lugares nuevos o zonas congestionadas.',
    tag: 'Carro',
  },
  {
    emoji: '🏍️',
    title: 'Motociclistas',
    text: 'Buscas espacios adecuados para estacionar tu moto con tranquilidad.',
    tag: 'Moto',
  },
  {
    emoji: '📍',
    title: 'Quienes visitan zonas desconocidas',
    text: 'Quieres saber dónde puedes estacionar antes de desplazarte.',
    tag: 'Planificación',
  },
]

export default function Audience() {
  const ref = useReveal()

  return (
    <section id="para-quien" className="section audience" ref={ref}>
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">¿Para quién?</span>
          <h2 className="section-title">Pensada para quienes se mueven en carro o moto</h2>
        </div>

        <div className="audience__grid">
          {AUDIENCE.map(({ emoji, title, text, tag }, i) => (
            <article key={title} className="audience-card reveal" style={{ '--delay': `${i * 110}ms` }}>
              <div className="audience-card__top">
                <span className="audience-card__emoji" aria-hidden="true">
                  {emoji}
                </span>
                <span className="audience-card__tag">{tag}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
