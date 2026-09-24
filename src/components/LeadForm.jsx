import { useRef, useState } from 'react'
import { User, Phone, Mail, Check, Loader2, AlertCircle, PartyPopper, Lock } from 'lucide-react'
import { submitLead } from '../services/leadService.js'
import { validators, validateAll, formatPhone, normalizePhone } from '../utils/validation.js'
import './LeadForm.css'

const INITIAL = { name: '', phone: '', email: '', consent: false }
const FIELD_ORDER = ['name', 'phone', 'email', 'consent']

function Field({ id, label, icon: Icon, error, touched, valid, children }) {
  return (
    <div className={`field ${touched && error ? 'field--error' : ''} ${valid ? 'field--valid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field__control">
        <Icon size={18} className="field__icon" aria-hidden="true" />
        {children}
        {valid && <Check size={18} className="field__ok" aria-hidden="true" />}
      </div>
      <p id={`${id}-error`} className="field__error" role={touched && error ? 'alert' : undefined}>
        {touched && error ? error : ''}
      </p>
    </div>
  )
}

export default function LeadForm() {
  const [values, setValues] = useState(INITIAL)
  const [touched, setTouched] = useState({})
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [submitError, setSubmitError] = useState('')
  const refs = { name: useRef(null), phone: useRef(null), email: useRef(null), consent: useRef(null) }

  const errors = validateAll(values)
  const isLoading = status === 'loading'

  const update = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (status === 'error') setStatus('idle')
  }

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target
    if (type === 'checkbox') {
      update(name, checked)
      setTouched((t) => ({ ...t, [name]: true }))
    } else if (name === 'phone') {
      update(name, formatPhone(value))
    } else {
      update(name, value)
    }
  }

  const handleBlur = (event) => {
    const { name } = event.target
    if (values[name] !== '' && values[name] !== false) setTouched((t) => ({ ...t, [name]: true }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isLoading) return

    setTouched({ name: true, phone: true, email: true, consent: true })
    const firstInvalid = FIELD_ORDER.find((key) => validators[key](values[key]))
    if (firstInvalid) {
      refs[firstInvalid].current?.focus()
      return
    }

    setStatus('loading')
    setSubmitError('')
    try {
      await submitLead({ ...values, phone: normalizePhone(values.phone) })
      setStatus('success')
    } catch (err) {
      console.error(err)
      setSubmitError(
        err.status === 429
          ? 'Recibimos demasiados intentos desde tu conexión. Espera unos minutos e inténtalo de nuevo.'
          : 'No pudimos enviar tu registro. Revisa tu conexión e inténtalo de nuevo.',
      )
      setStatus('error')
    }
  }

  const reset = () => {
    setValues(INITIAL)
    setTouched({})
    setStatus('idle')
  }

  if (status === 'success') {
    return (
      <div className="lead-card lead-success" role="status" aria-live="polite">
        <span className="lead-success__icon">
          <PartyPopper size={34} aria-hidden="true" />
        </span>
        <h3>¡Gracias por tu interés!</h3>
        <p>Tu registro fue recibido. Te mantendremos informado sobre ApartaTuEspacio.</p>
        <button type="button" className="lead-success__again" onClick={reset}>
          Registrar a otra persona
        </button>
      </div>
    )
  }

  const describedBy = (key) => (touched[key] && errors[key] ? `${key}-error` : undefined)
  const isValid = (key) => touched[key] && !errors[key]

  return (
    <form className="lead-card lead-form" onSubmit={handleSubmit} noValidate aria-labelledby="lead-title">
      <div className="lead-form__head">
        <span className="lead-form__pill">
          <span className="lead-form__pill-dot" aria-hidden="true" /> Registro abierto
        </span>
        <h3 id="lead-title">¿Quieres conocer ApartaTuEspacio?</h3>
        <p>Déjanos tus datos. Solo toma un momento.</p>
      </div>

      <Field id="name" label="Nombre" icon={User} error={errors.name} touched={touched.name} valid={isValid('name')}>
        <input
          ref={refs.name}
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          placeholder="Escribe tu nombre"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={60}
          required
          aria-required="true"
          aria-invalid={Boolean(touched.name && errors.name)}
          aria-describedby={describedBy('name')}
          disabled={isLoading}
        />
      </Field>

      <Field id="phone" label="Número de teléfono" icon={Phone} error={errors.phone} touched={touched.phone} valid={isValid('phone')}>
        <input
          ref={refs.phone}
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="300 123 4567"
          value={values.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          aria-required="true"
          aria-invalid={Boolean(touched.phone && errors.phone)}
          aria-describedby={describedBy('phone')}
          disabled={isLoading}
        />
      </Field>

      <Field id="email" label="Correo electrónico" icon={Mail} error={errors.email} touched={touched.email} valid={isValid('email')}>
        <input
          ref={refs.email}
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="tucorreo@email.com"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={120}
          required
          aria-required="true"
          aria-invalid={Boolean(touched.email && errors.email)}
          aria-describedby={describedBy('email')}
          disabled={isLoading}
        />
      </Field>

      <div className={`consent ${touched.consent && errors.consent ? 'consent--error' : ''}`}>
        <label className="consent__label">
          <input
            ref={refs.consent}
            type="checkbox"
            name="consent"
            checked={values.consent}
            onChange={handleChange}
            aria-invalid={Boolean(touched.consent && errors.consent)}
            aria-describedby={describedBy('consent')}
            disabled={isLoading}
          />
          <span className="consent__box" aria-hidden="true">
            <Check size={14} strokeWidth={3} />
          </span>
          <span>Acepto que mis datos sean utilizados para recibir información relacionada con ApartaTuEspacio.</span>
        </label>
        <p id="consent-error" className="field__error" role={touched.consent && errors.consent ? 'alert' : undefined}>
          {touched.consent && errors.consent ? errors.consent : ''}
        </p>
      </div>

      {status === 'error' && (
        <div className="lead-form__alert" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          {submitError}
        </div>
      )}

      <button type="submit" className="btn btn--primary btn--lg btn--block lead-form__submit" disabled={isLoading} aria-busy={isLoading}>
        {isLoading ? (
          <>
            <Loader2 size={20} className="spin" aria-hidden="true" /> Enviando…
          </>
        ) : (
          'Quiero ser parte'
        )}
      </button>

      <p className="lead-form__privacy">
        <Lock size={13} aria-hidden="true" /> Tus datos solo se usarán para informarte sobre ApartaTuEspacio.
      </p>
    </form>
  )
}
