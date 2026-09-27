import { ArrowRight } from 'lucide-react'
import { scrollToId, FORM_ID } from '../hooks/scrollTo.js'
import { track } from '../services/analytics.js'

// Nombre de la zona de la página donde está el botón, para el panel de métricas.
const ZONES = {
  inicio: 'Hero',
  problema: 'Problema',
  beneficios: 'Beneficios',
  'mobile-menu': 'Menú móvil',
}

function zoneOf(element) {
  if (element.closest('.mobile-cta')) return 'Barra fija móvil'
  if (element.closest('footer')) return 'Footer'
  const zone = element.closest('[id]')?.id
  if (ZONES[zone]) return ZONES[zone]
  if (element.closest('header')) return 'Navbar'
  return zone || 'Otro'
}

/** Botón de llamado a la acción: todos llevan al formulario de registro. */
export default function CtaButton({ children = 'Quiero conocer ApartaTuEspacio', size = 'lg', className = '', onClick }) {
  const handleClick = (event) => {
    event.preventDefault()
    track('cta_click', { label: zoneOf(event.currentTarget) })
    onClick?.()
    scrollToId(FORM_ID)
  }

  return (
    <a href={`#${FORM_ID}`} onClick={handleClick} className={`btn btn--primary btn--${size} ${className}`}>
      {children}
      <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
    </a>
  )
}
