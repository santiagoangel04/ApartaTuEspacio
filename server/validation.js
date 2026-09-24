// Mismas reglas que el formulario (src/utils/validation.js). El servidor vuelve a validar
// porque cualquiera puede enviar datos a la API sin pasar por la landing.
const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ' .-]{2,60}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^(3\d{9}|60\d{8})$/

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

export function validateLead(lead) {
  const errors = {}
  if (!NAME_RE.test(lead.name)) errors.name = 'Nombre inválido'
  if (!PHONE_RE.test(lead.phone)) errors.phone = 'Teléfono inválido'
  if (lead.email.length > 120 || !EMAIL_RE.test(lead.email)) errors.email = 'Correo inválido'
  if (!lead.consent) errors.consent = 'Se requiere autorización de datos'
  return errors
}
