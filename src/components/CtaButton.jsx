import { ArrowRight } from 'lucide-react'
import { scrollToId, FORM_ID } from '../hooks/scrollTo.js'

/** Botón de llamado a la acción: todos llevan al formulario de registro. */
export default function CtaButton({ children = 'Quiero conocer ApartaTuEspacio', size = 'lg', className = '', onClick }) {
  const handleClick = (event) => {
    event.preventDefault()
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
