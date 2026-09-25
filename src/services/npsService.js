import { apiUrl } from './apiBase.js'

const ENDPOINT = apiUrl('/api/nps')

/** Envía una respuesta de la encuesta NPS. Sin API configurada, simula el envío (modo demo). */
export async function submitNps({ score, comment, email }) {
  const payload = {
    score,
    comment: comment.trim(),
    email: email.trim().toLowerCase(),
    source: 'encuesta-nps',
  }

  if (!ENDPOINT) {
    await new Promise((resolve) => setTimeout(resolve, 900))
    if (import.meta.env.DEV) console.info('[ApartaTuEspacio] NPS (modo demo):', payload)
    return { ok: true, demo: true }
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = new Error(`Error ${response.status} al enviar la encuesta`)
    error.status = response.status
    throw error
  }
  return { ok: true }
}
