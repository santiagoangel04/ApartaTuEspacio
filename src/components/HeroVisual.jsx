import { useEffect, useState } from 'react'
import { Search, MapPin, CircleDollarSign } from 'lucide-react'

const ROUTE = 'M120 450 L120 300 L285 300 L285 212'

/* Manzanas de la ciudad (x, y, ancho, alto) */
const BLOCKS = [
  [12, 12, 88, 40], [12, 60, 50, 42], [70, 60, 30, 42],
  [143, 12, 60, 90], [211, 12, 64, 42], [211, 62, 64, 40],
  [298, 12, 90, 30],
  [12, 143, 88, 70], [12, 221, 88, 64],
  [143, 143, 55, 70], [206, 143, 69, 50], [143, 221, 40, 64], [191, 201, 84, 84],
  [298, 143, 90, 55], [298, 206, 40, 80], [346, 206, 42, 80],
  [12, 313, 88, 60], [12, 381, 88, 60],
  [143, 313, 132, 50], [143, 371, 60, 70], [211, 371, 64, 70],
]

function Pin({ x, y, variant = 'blue', label }) {
  return (
    <g transform={`translate(${x} ${y})`} className={`hv-pin hv-pin--${variant}`}>
      {variant === 'green' && <circle className="hv-pulse" cx="0" cy="-26" r="16" />}
      <ellipse cx="0" cy="2" rx="8" ry="3" fill="rgba(0,0,0,.35)" />
      <path d="M0 0 C-10 -11 -16 -18 -16 -26 A16 16 0 1 1 16 -26 C16 -18 10 -11 0 0Z" className="hv-pin__body" />
      <text x="0" y="-21" textAnchor="middle" className="hv-pin__label">
        {label}
      </text>
    </g>
  )
}

export default function HeroVisual() {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    setAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  return (
    <div className="hv" role="img" aria-label="Ilustración conceptual: un mapa con tu destino, parqueaderos cercanos y un espacio disponible">
      <div className="hv__glow" aria-hidden="true" />

      <div className="hv__card" aria-hidden="true">
        <div className="hv__search">
          <Search size={16} />
          <span>¿A dónde vas hoy?</span>
          <span className="hv__search-tag">Vista conceptual</span>
        </div>

        <svg viewBox="0 0 400 440" className="hv__map">
          <defs>
            <linearGradient id="hvRoute" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#3b82f6" />
              <stop offset="1" stopColor="#22d3ee" />
            </linearGradient>
            <clipPath id="hvClip">
              <rect width="400" height="440" rx="18" />
            </clipPath>
          </defs>

          <g clipPath="url(#hvClip)">
            <rect width="400" height="440" fill="#0c1c44" />

            {/* Vías */}
            <g className="hv-roads">
              <rect x="0" y="107" width="400" height="26" />
              <rect x="0" y="287" width="400" height="26" />
              <rect x="107" y="0" width="26" height="440" />
              <rect x="272" y="0" width="26" height="440" />
            </g>
            <g className="hv-lanes">
              <line x1="0" y1="120" x2="400" y2="120" />
              <line x1="0" y1="300" x2="400" y2="300" />
              <line x1="120" y1="0" x2="120" y2="440" />
              <line x1="285" y1="0" x2="285" y2="440" />
            </g>

            {/* Manzanas */}
            <g className="hv-blocks">
              {BLOCKS.map(([x, y, w, h], i) => (
                <rect key={i} x={x} y={y} width={w} height={h} rx="7" />
              ))}
            </g>

            {/* Parque */}
            <rect x="298" y="313" width="90" height="128" rx="10" className="hv-park" />
            <circle cx="325" cy="350" r="9" className="hv-tree" />
            <circle cx="360" cy="380" r="11" className="hv-tree" />
            <circle cx="330" cy="410" r="8" className="hv-tree" />

            {/* Ruta hacia el destino */}
            <path d={ROUTE} className="hv-route-bg" />
            <path d={ROUTE} className="hv-route" stroke="url(#hvRoute)" />

            {/* Destino */}
            <g transform="translate(285 212)">
              <circle r="22" className="hv-dest-ring" />
              <circle r="9" fill="#fff" />
              <circle r="4.5" fill="#2563eb" />
            </g>
            <g transform="translate(300 240)">
              <rect width="74" height="24" rx="12" fill="#fff" />
              <text x="37" y="16" textAnchor="middle" className="hv-dest-label">
                Tu destino
              </text>
            </g>

            {/* Parqueaderos */}
            <Pin x={233} y={250} variant="green" label="P" />
            <Pin x={345} y={98} label="P" />
            <Pin x={56} y={200} label="P" />
            <Pin x={235} y={425} label="P" />

            {/* Moto */}
            <g className="hv-moto">
              <g>
                <rect x="-11" y="-3.5" width="22" height="7" rx="3.5" fill="#fbbf24" />
                <rect x="4" y="-7" width="2.5" height="14" rx="1.2" fill="#fde68a" />
                <circle cx="-2" cy="0" r="3" fill="#0c1c44" />
                {animate ? (
                  <animateMotion dur="9s" repeatCount="indefinite" path="M-30 126 L430 126" />
                ) : (
                  <animateMotion dur="0.01s" fill="freeze" path="M60 126 L60 126" />
                )}
              </g>
            </g>

            {/* Carro */}
            <g className="hv-car">
              <g>
                <rect x="-17" y="-10" width="34" height="20" rx="7" fill="#fff" />
                <rect x="3" y="-7.5" width="8" height="15" rx="2.5" fill="#93c5fd" />
                <rect x="-13" y="-7" width="5" height="14" rx="2" fill="#bfdbfe" />
                <rect x="13" y="-8" width="3" height="4" rx="1" fill="#fde68a" />
                <rect x="13" y="4" width="3" height="4" rx="1" fill="#fde68a" />
                {animate ? (
                  <animateMotion
                    dur="7s"
                    repeatCount="indefinite"
                    rotate="auto"
                    path={ROUTE}
                    keyPoints="0;0.93;0.93"
                    keyTimes="0;0.7;1"
                    calcMode="linear"
                  />
                ) : (
                  <animateMotion dur="0.01s" fill="freeze" rotate="auto" path="M120 395 L120 380" />
                )}
              </g>
            </g>
          </g>
        </svg>
      </div>

      {/* Chips flotantes */}
      <div className="hv__chip hv__chip--a" aria-hidden="true">
        <span className="hv__dot" />
        <div>
          <strong>Espacio disponible</strong>
          <small>Cerca de tu destino</small>
        </div>
      </div>
      <div className="hv__chip hv__chip--b" aria-hidden="true">
        <span className="hv__chip-icon">
          <MapPin size={16} />
        </span>
        <strong>Opciones cercanas</strong>
      </div>
      <div className="hv__chip hv__chip--c" aria-hidden="true">
        <span className="hv__chip-icon hv__chip-icon--alt">
          <CircleDollarSign size={16} />
        </span>
        <strong>Tarifa antes de llegar</strong>
      </div>
    </div>
  )
}
