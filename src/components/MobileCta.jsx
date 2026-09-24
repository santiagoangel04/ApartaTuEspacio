import { useEffect, useState } from 'react'
import CtaButton from './CtaButton.jsx'
import { FORM_ID } from '../hooks/scrollTo.js'
import './MobileCta.css'

/**
 * Barra fija inferior (solo móvil) que aparece después del hero
 * y se oculta cuando el formulario ya está en pantalla.
 */
export default function MobileCta() {
  const [heroVisible, setHeroVisible] = useState(true)
  const [formVisible, setFormVisible] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('inicio')
    const form = document.getElementById(FORM_ID)
    if (!hero || !form || !('IntersectionObserver' in window)) return

    const heroObs = new IntersectionObserver(([e]) => setHeroVisible(e.isIntersecting), { threshold: 0.1 })
    const formObs = new IntersectionObserver(([e]) => setFormVisible(e.isIntersecting), { threshold: 0.05 })
    heroObs.observe(hero)
    formObs.observe(form)
    return () => {
      heroObs.disconnect()
      formObs.disconnect()
    }
  }, [])

  const show = !heroVisible && !formVisible

  return (
    <div className={`mobile-cta ${show ? 'is-shown' : ''}`} aria-hidden={!show}>
      <CtaButton className="btn--block">Quiero conocer ApartaTuEspacio</CtaButton>
    </div>
  )
}
