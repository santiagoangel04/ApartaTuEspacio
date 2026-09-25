// Mismas reglas que el formulario (src/utils/validation.js). El servidor vuelve a validar
// porque cualquiera puede enviar datos a la API sin pasar por la landing.
const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ' .-]{2,60}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^(3\d{9}|60\d{8})$/

// Proveedores de correo aceptados. Mantener igual a la lista de src/utils/validation.js.
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.es',
  'yahoo.com.co',
  'hotmail.com',
  'hotmail.es',
  'outlook.com',
  'outlook.es',
  'live.com',
]

export function normalizeLead(body = {}) {
  let phone = String(body.phone ?? '').replace(/\D/g, '')
  if (phone.length > 10 && phone.startsWith('57')) phone = phone.slice(2)

  return {
    name: String(body.name ?? '').trim().replace(/\s+/g, ' '),
    phone,
    email: String(body.email ?? '').trim().toLowerCase(),
    consent: body.consent === true,
    source: String(body.source ?? 'landing').slice(0, 60),
  }
}

const isAllowedEmail = (email) =>
  email.length <= 120 &&
  EMAIL_RE.test(email) &&
  ALLOWED_EMAIL_DOMAINS.includes(email.slice(email.lastIndexOf('@') + 1))

// ---------- Encuesta NPS ----------
export function normalizeNps(body = {}) {
  return {
    score: body.score,
    comment: String(body.comment ?? '').trim().slice(0, 500),
    email: String(body.email ?? '').trim().toLowerCase(),
    source: String(body.source ?? 'encuesta-nps').slice(0, 60),
  }
}

export function validateNps(nps) {
  const errors = {}
  if (!Number.isInteger(nps.score) || nps.score < 0 || nps.score > 10) errors.score = 'Puntaje inválido (0 a 10)'
  if (nps.email && !isAllowedEmail(nps.email)) errors.email = 'Correo inválido o proveedor no permitido'
  return errors
}

export function validateLead(lead) {
  const errors = {}
  if (!NAME_RE.test(lead.name)) errors.name = 'Nombre inválido'
  if (!PHONE_RE.test(lead.phone)) errors.phone = 'Teléfono inválido'
  if (lead.email.length > 120 || !EMAIL_RE.test(lead.email)) errors.email = 'Correo inválido'
  else if (!ALLOWED_EMAIL_DOMAINS.includes(lead.email.slice(lead.email.lastIndexOf('@') + 1))) {
    errors.email = 'Proveedor de correo no permitido'
  }
  if (!lead.consent) errors.consent = 'Se requiere autorización de datos'
  return errors
}
