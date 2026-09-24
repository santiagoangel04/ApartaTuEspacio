/** Hace scroll suave hasta una sección por id, respetando la altura del navbar (scroll-margin-top). */
export function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}

export const FORM_ID = 'registro'
