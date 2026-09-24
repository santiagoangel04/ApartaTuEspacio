import Logo from './Logo.jsx'
import CtaButton from './CtaButton.jsx'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Logo light />
          <p>Encuentra dónde parquear antes de llegar.</p>
        </div>
        <CtaButton size="sm">Quiero conocer ApartaTuEspacio</CtaButton>
      </div>
      <div className="container footer__bottom">
        <span className="footer__status">
          <span aria-hidden="true" /> Proyecto en etapa de validación.
        </span>
        <span>© {new Date().getFullYear()} ApartaTuEspacio</span>
      </div>
    </footer>
  )
}
