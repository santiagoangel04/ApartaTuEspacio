import './Logo.css'

export default function Logo({ light = false }) {
  return (
    <span className={`logo ${light ? 'logo--light' : ''}`}>
      <span className="logo__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="32" height="32">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#2563eb" />
              <stop offset="1" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="9" fill="url(#logoGrad)" />
          <path d="M16 27s-7-6.4-7-12.4a7 7 0 0 1 14 0C23 20.6 16 27 16 27z" fill="#fff" />
          <text x="16" y="17.6" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#1d4ed8" fontFamily="Arial, sans-serif">
            P
          </text>
        </svg>
      </span>
      <span className="logo__text">
        Aparta<strong>Tu</strong>Espacio
      </span>
    </span>
  )
}
