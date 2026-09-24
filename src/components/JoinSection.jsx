import { MessageCircle, Rocket, Users } from 'lucide-react'
import LeadForm from './LeadForm.jsx'
import { useReveal } from '../hooks/useReveal.js'
import './JoinSection.css'

/** Sección de validación + formulario de interesados. */
export default function JoinSection() {
  const ref = useReveal()

  return (
    <section id="registro" className="section section--dark join" ref={ref}>
      <div className="container join__inner">
        <div className="join__copy reveal">
          <span className="eyebrow">Únete a la validación</span>
          <h2 className="section-title">
            Estamos construyendo <span className="text-gradient">ApartaTuEspacio</span>
          </h2>
          <p className="section-sub">
            Queremos conocer tu opinión y saber si una solución como ApartaTuEspacio sería útil para ti. Déjanos tus datos
            y sé de los primeros en conocer cómo evolucionará esta idea.
          </p>

          <blockquote className="join__quote">
            Tu opinión puede ayudarnos a construir una solución que realmente necesiten los conductores.
          </blockquote>

          <ul className="join__perks">
            <li>
              <span>
                <Rocket size={18} aria-hidden="true" />
              </span>
              Entérate primero de los avances
            </li>
            <li>
              <span>
                <MessageCircle size={18} aria-hidden="true" />
              </span>
              Comparte tu experiencia y tu opinión
            </li>
            <li>
              <span>
                <Users size={18} aria-hidden="true" />
              </span>
              Ayuda a darle forma a la idea
            </li>
          </ul>
        </div>

        <div className="reveal" style={{ '--delay': '120ms' }}>
          <LeadForm />
        </div>
      </div>
    </section>
  )
}
