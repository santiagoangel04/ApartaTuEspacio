import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import Logo from './Logo.jsx'
import CtaButton from './CtaButton.jsx'
import { scrollToId } from '../hooks/scrollTo.js'
import './Navbar.css'

const LINKS = [
  { id: 'problema', label: 'Problema' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'beneficios', label: 'Beneficios' },
  { id: 'registro', label: 'Únete' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)')
    const close = () => mq.matches && setOpen(false)
    mq.addEventListener('change', close)
    return () => mq.removeEventListener('change', close)
  }, [])

  // Libera el scroll del body antes de desplazarse; si se espera al efecto, el scroll se bloquea.
  const closeMenu = () => {
    document.body.style.overflow = ''
    setOpen(false)
  }

  const go = (id) => (event) => {
    event.preventDefault()
    closeMenu()
    scrollToId(id)
  }

  return (
    <header className={`nav ${scrolled || open ? 'nav--solid' : ''}`}>
      <div className="container nav__inner">
        <a href="#inicio" onClick={go('inicio')} aria-label="ApartaTuEspacio, ir al inicio">
          <Logo light />
        </a>

        <nav className="nav__links" aria-label="Principal">
          {LINKS.map((link) => (
            <a key={link.id} href={`#${link.id}`} onClick={go(link.id)}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="nav__actions">
          <CtaButton size="sm" className="nav__cta">
            Quiero conocerla
          </CtaButton>
          <button
            type="button"
            className="nav__toggle"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="nav__mobile" hidden={!open}>
        <nav aria-label="Menú móvil">
          {LINKS.map((link, i) => (
            <a key={link.id} href={`#${link.id}`} onClick={go(link.id)} style={{ '--i': i }}>
              {link.label}
            </a>
          ))}
        </nav>
        <CtaButton className="btn--block" onClick={closeMenu}>
          Quiero conocerla
        </CtaButton>
        <p className="nav__mobile-note">Proyecto en etapa de validación</p>
      </div>
    </header>
  )
}
