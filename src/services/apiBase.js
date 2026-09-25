/**
 * Base de la API a partir de VITE_LEADS_ENDPOINT.
 * Acepta la URL completa o solo el dominio: "mi-api.up.railway.app" → "https://mi-api.up.railway.app".
 * Sin "https://" el navegador la trataría como una ruta relativa dentro de la propia página.
 * Devuelve null si no hay API configurada (modo demo).
 */
export function apiUrl(path) {
  const raw = (import.meta.env.VITE_LEADS_ENDPOINT || '').trim()
  if (!raw) return null
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  url.pathname = path
  url.search = ''
  return url.toString()
}
