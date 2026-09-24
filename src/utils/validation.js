const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ' .-]+$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// Celulares en Colombia (10 dígitos, inician en 3) o fijos con el formato actual (10 dígitos, inician en 60).
const PHONE_RE = /^(3\d{9}|60\d{8})$/

export const onlyDigits = (value) => value.replace(/\D/g, '')

/** Normaliza el teléfono: quita el indicativo +57 si viene incluido y deja solo dígitos. */
export function normalizePhone(value) {
  let digits = onlyDigits(value)
  if (digits.length > 10 && digits.startsWith('57')) digits = digits.slice(2)
  return digits.slice(0, 10)
}

/** Formatea para mostrar mientras se escribe: 300 123 4567 */
export function formatPhone(value) {
  const d = normalizePhone(value)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
}

export const validators = {
  name(value) {
    const v = value.trim()
    if (!v) return 'Escribe tu nombre.'
    if (v.length < 2) return 'Tu nombre debe tener al menos 2 letras.'
    if (v.length > 60) return 'Tu nombre es demasiado largo.'
    if (!NAME_RE.test(v)) return 'Usa solo letras en tu nombre.'
    return ''
  },
  phone(value) {
    const d = normalizePhone(value)
    if (!d) return 'Escribe tu número de teléfono.'
    if (d.length < 10) return 'El número debe tener 10 dígitos. Ej: 300 123 4567'
    if (!PHONE_RE.test(d)) return 'Ingresa un número válido. Ej: 300 123 4567'
    return ''
  },
  email(value) {
    const v = value.trim()
    if (!v) return 'Escribe tu correo electrónico.'
    if (!EMAIL_RE.test(v)) return 'Revisa tu correo. Ej: tucorreo@email.com'
    return ''
  },
  consent(value) {
    return value ? '' : 'Debes aceptar para poder registrarte.'
  },
}

export function validateAll(values) {
  return Object.fromEntries(Object.keys(validators).map((key) => [key, validators[key](values[key])]))
}
