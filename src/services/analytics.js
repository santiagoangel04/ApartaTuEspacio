import { apiUrl } from './apiBase.js'

/**
 * Medición anónima de visitas para el panel privado de métricas.
 * - No usa cookies ni guarda datos personales: solo un id aleatorio por navegador y por pestaña.
 * - Para excluir las visitas del equipo, abre una vez la landing con ?notrack=1 (y ?notrack=0 para volver a medir).
 */
const ENDPOINT = apiUrl('/api/events')
const NOTRACK_KEY = 'ate_notrack'

const safe = (fn, fallback) => {
  try {
    return fn()
  } catch {
    return fallback
  }
}

const randomId = () =>
  safe(() => crypto.randomUUID(), null) ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

function persistentId(getStorage, key) {
  return safe(() => {
    const storage = getStorage()
    let id = storage.getItem(key)
    if (!id) {
      id = randomId()
      storage.setItem(key, id)
    }
    return id
  }, randomId())
}

function trackingDisabled() {
  const flag = new URLSearchParams(location.search).get('notrack')
  if (flag === '1') safe(() => localStorage.setItem(NOTRACK_KEY, '1'))
  if (flag === '0') safe(() => localStorage.removeItem(NOTRACK_KEY))
  return safe(() => localStorage.getItem(NOTRACK_KEY) === '1', false)
}

const enabled = Boolean(ENDPOINT) && !trackingDisabled()
const visitorId = enabled ? persistentId(() => localStorage, 'ate_vid') : null
const sessionId = enabled ? persistentId(() => sessionStorage, 'ate_sid') : null

function deviceType() {
  if (matchMedia('(max-width: 640px)').matches) return 'mobile'
  if (matchMedia('(max-width: 1024px)').matches) return 'tablet'
  return 'desktop'
}

/** Solo se guarda el sitio de origen si es externo (una recarga no cuenta como referencia). */
function externalReferrer() {
  return safe(() => {
    if (!document.referrer) return ''
    const ref = new URL(document.referrer)
    return ref.host === location.host ? '' : `${ref.origin}${ref.pathname}`
  }, '')
}

export function track(type, extra = {}) {
  if (!enabled) return
  const params = new URLSearchParams(location.search)
  const payload = {
    type,
    visitorId,
    sessionId,
    path: location.pathname,
    referrer: externalReferrer(),
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
    device: deviceType(),
    ...extra,
  }
  // text/plain evita la petición previa de CORS; keepalive permite enviar aunque la persona cambie de página.
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {})
}

/** Registra la visita y, una sola vez, cuando el formulario aparece en pantalla. */
let started = false

// Pulso cada 30 s mientras la pestaña está visible, hasta 30 minutos: permite ver quién está en la
// página en este momento y medir el tiempo de permanencia.
const HEARTBEAT_MS = 30_000
const HEARTBEAT_MAX = 60

function startHeartbeat() {
  let beats = 0
  const timer = setInterval(() => {
    if (document.visibilityState !== 'visible') return
    track('heartbeat')
    if (++beats >= HEARTBEAT_MAX) clearInterval(timer)
  }, HEARTBEAT_MS)
}

export function initAnalytics(formId) {
  // StrictMode ejecuta los efectos dos veces en desarrollo: se cuenta una sola visita.
  if (!enabled || started) return
  started = true
  track('pageview')
  startHeartbeat()

  const form = document.getElementById(formId)
  if (!form || !('IntersectionObserver' in window)) return
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        track('form_view')
        observer.disconnect()
      }
    },
    { threshold: 0.3 },
  )
  observer.observe(form)
}
