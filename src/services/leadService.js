/**
 * Servicio de registro de interesados (leads).
 *
 * Para conectar un backend real basta con definir VITE_LEADS_ENDPOINT en un archivo .env
 * (ver .env.example). El endpoint recibe un POST con JSON y debe responder 2xx si el
 * registro fue exitoso. Funciona con Formspree, Google Apps Script, Supabase, una API propia, etc.
 *
 * Si no hay endpoint configurado, se simula el envío (modo demo) para validar el flujo en frontend.
 */
const ENDPOINT = normalizeEndpoint(import.meta.env.VITE_LEADS_ENDPOINT)

/**
 * Acepta la URL completa o solo el dominio de la API:
 * "mi-api.up.railway.app" → "https://mi-api.up.railway.app/api/leads".
 * Sin "https://" el navegador la trataría como una ruta relativa dentro de la propia landing.
 */
function normalizeEndpoint(value) {
  const raw = (value || '').trim()
  if (!raw) return ''
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  if (url.pathname === '/' || url.pathname === '') url.pathname = '/api/leads'
  return url.toString()
}

export async function submitLead({ name, phone, email, consent }) {
  const payload = {
    name: name.trim(),
    phone,
    email: email.trim().toLowerCase(),
    consent,
    source: 'landing-apartatuespacio',
    createdAt: new Date().toISOString(),
  }

  if (!ENDPOINT) {
    await new Promise((resolve) => setTimeout(resolve, 1100))
    if (import.meta.env.DEV) console.info('[ApartaTuEspacio] Lead (modo demo):', payload)
    return { ok: true, demo: true }
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = new Error(`Error ${response.status} al registrar el interesado`)
    error.status = response.status
    throw error
  }
  return { ok: true }
}
