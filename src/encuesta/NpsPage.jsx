import { useRef, useState } from 'react'
import { Check, Loader2, AlertCircle, Mail, Lock } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { submitNps } from '../services/npsService.js'
import { ALLOWED_EMAIL_DOMAINS } from '../utils/validation.js'
import './NpsPage.css'

const SCORES = Array.from({ length: 11 }, (_, i) => i)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_COMMENT = 500

/** Pregunta de seguimiento según la categoría NPS (detractor 0–6, pasivo 7–8, promotor 9–10). */
function followUp(score) {
  if (score <= 6) return '¿Qué haría que una solución así te fuera más útil?'
  if (score <= 8) return '¿Qué le falta para que la recomiendes sin dudarlo?'
  return '¿Qué es lo que más te gusta de la idea?'
}

function scoreTone(score) {
  if (score <= 6) return 'low'
  if (score <= 8) return 'mid'
  return 'high'
}

function validateEmail(value) {
  const v = value.trim().toLowerCase()
  if (!v) return '' // opcional
  if (!EMAIL_RE.test(v)) return 'Revisa tu correo. Ej: tucorreo@gmail.com'
  if (!ALLOWED_EMAIL_DOMAINS.includes(v.slice(v.lastIndexOf('@') + 1))) {
    return 'Usa un correo de Gmail, Yahoo, Hotmail u Outlook.'
  }
  return ''
}

export default function NpsPage() {
  const [score, setScore] = useState(null)
  const [comment, setComment] = useState('')
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [scoreError, setScoreError] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [submitError, setSubmitError] = useState('')
  const scaleRef = useRef(null)
  const emailRef = useRef(null)

  const emailError = validateEmail(email)
  const isLoading = status === 'loading'

  const pick = (value) => {
    setScore(value)
    setScoreError(false)
    if (status === 'error') setStatus('idle')
  }

  // Navegación con flechas dentro de la escala (patrón radiogroup)
  const onScaleKey = (event) => {
    const keys = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }
    if (!(event.key in keys)) return
    event.preventDefault()
    const next = Math.min(10, Math.max(0, (score ?? 0) + (score === null ? 0 : keys[event.key])))
    pick(next)
    scaleRef.current?.querySelector(`[data-score="${next}"]`)?.focus()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isLoading) return
    if (score === null) {
      setScoreError(true)
      scaleRef.current?.querySelector('[data-score="0"]')?.focus()
      return
    }
    if (emailError) {
      setEmailTouched(true)
      emailRef.current?.focus()
      return
    }

    setStatus('loading')
    setSubmitError('')
    try {
      await submitNps({ score, comment, email })
      setStatus('success')
    } catch (err) {
      console.error(err)
      setSubmitError(
        err.status === 429
          ? 'Recibimos demasiados intentos desde tu conexión. Espera unos minutos e inténtalo de nuevo.'
          : 'No pudimos enviar tu respuesta. Revisa tu conexión e inténtalo de nuevo.',
      )
      setStatus('error')
    }
  }

  return (
    <div className="nps-page">
      <header className="nps-header">
        <Logo light />
      </header>

      <main className="nps-main">
        {status === 'success' ? (
          <section className="nps-card nps-done" role="status" aria-live="polite">
            <span className="nps-done__icon">
              <Check size={34} strokeWidth={3} aria-hidden="true" />
            </span>
            <h1>¡Gracias por tu respuesta!</h1>
            <p>Tu opinión nos ayuda a decidir cómo construir ApartaTuEspacio.</p>
          </section>
        ) : (
          <form className="nps-card" onSubmit={handleSubmit} noValidate>
            <span className="nps-pill">Encuesta · 1 minuto</span>
            <h1 className="nps-title">Tu opinión sobre ApartaTuEspacio</h1>
            <p className="nps-context">
              ApartaTuEspacio es una idea en validación para encontrar dónde parquear tu carro o moto antes de llegar a
              tu destino.
            </p>

            <fieldset className="nps-block">
              <legend id="nps-question">
                Del 0 al 10, ¿qué tan probable es que recomiendes una solución como ApartaTuEspacio a un amigo o
                familiar?
              </legend>

              <div
                ref={scaleRef}
                className={`nps-scale ${scoreError ? 'nps-scale--error' : ''}`}
                role="radiogroup"
                aria-labelledby="nps-question"
                aria-describedby={scoreError ? 'score-error' : undefined}
                onKeyDown={onScaleKey}
              >
                {SCORES.map((value) => {
                  const selected = score === value
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`${value}`}
                      tabIndex={selected || (score === null && value === 0) ? 0 : -1}
                      data-score={value}
                      className={`nps-score nps-score--${scoreTone(value)} ${selected ? 'is-selected' : ''}`}
                      onClick={() => pick(value)}
                      disabled={isLoading}
                    >
                      {value}
                    </button>
                  )
                })}
              </div>
              <div className="nps-scale__labels" aria-hidden="true">
                <span>Nada probable</span>
                <span>Muy probable</span>
              </div>
              <p id="score-error" className="nps-error" role={scoreError ? 'alert' : undefined}>
                {scoreError ? 'Elige un número del 0 al 10.' : ''}
              </p>
            </fieldset>

            {score !== null && (
              <div className="nps-block nps-reveal">
                <label htmlFor="comment" className="nps-label">
                  {followUp(score)} <span className="nps-optional">(opcional)</span>
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  maxLength={MAX_COMMENT}
                  placeholder="Escribe aquí tu respuesta"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={isLoading}
                />
                <p className="nps-counter">
                  {comment.length}/{MAX_COMMENT}
                </p>
              </div>
            )}

            <div className="nps-block">
              <label htmlFor="nps-email" className="nps-label">
                Tu correo <span className="nps-optional">(opcional, si quieres que te contactemos)</span>
              </label>
              <div className={`nps-input ${emailTouched && emailError ? 'nps-input--error' : ''}`}>
                <Mail size={18} aria-hidden="true" />
                <input
                  ref={emailRef}
                  id="nps-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={120}
                  placeholder="tucorreo@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  aria-invalid={Boolean(emailTouched && emailError)}
                  aria-describedby={emailTouched && emailError ? 'nps-email-error' : undefined}
                  disabled={isLoading}
                />
              </div>
              <p id="nps-email-error" className="nps-error" role={emailTouched && emailError ? 'alert' : undefined}>
                {emailTouched && emailError ? emailError : ''}
              </p>
            </div>

            {status === 'error' && (
              <div className="nps-alert" role="alert">
                <AlertCircle size={18} aria-hidden="true" />
                {submitError}
              </div>
            )}

            <button type="submit" className="btn btn--primary btn--lg btn--block nps-submit" disabled={isLoading} aria-busy={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={20} className="nps-spin" aria-hidden="true" /> Enviando…
                </>
              ) : (
                'Enviar respuesta'
              )}
            </button>

            <p className="nps-privacy">
              <Lock size={13} aria-hidden="true" /> Tus respuestas solo se usarán para mejorar ApartaTuEspacio.
            </p>
          </form>
        )}
      </main>

      <footer className="nps-footer">ApartaTuEspacio · Proyecto en etapa de validación.</footer>
    </div>
  )
}
