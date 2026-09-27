import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import pg from 'pg'
import { normalizeLead, validateLead, normalizeNps, validateNps } from './validation.js'
import { normalizeEvent, isBot, getMetrics, getLive, EVENT_ORIGINS } from './analytics.js'
import { adminEnabled, verifyPassword, createSession, verifySession } from './auth.js'

const PORT = process.env.PORT || 3000
// En Railway se define como referencia al servicio de Postgres: ${{Postgres.DATABASE_URL}}
const DATABASE_URL = process.env.DATABASE_URL
const ADMIN_PAGE = fileURLToPath(new URL('./admin/index.html', import.meta.url))
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://santiagoangel04.github.io,http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

if (!DATABASE_URL) {
  console.error('Falta la variable DATABASE_URL con la conexión a PostgreSQL.')
  process.exit(1)
}

// La red interna de Railway (*.railway.internal) no usa SSL. Si se usa la URL pública, define PGSSL=true.
const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: 5,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
})

pool.on('error', (err) => console.error('Error inesperado en PostgreSQL:', err.message))

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      name VARCHAR(60) NOT NULL,
      phone VARCHAR(10) NOT NULL,
      email VARCHAR(120) NOT NULL UNIQUE,
      consent BOOLEAN NOT NULL DEFAULT TRUE,
      source VARCHAR(60) NOT NULL DEFAULT 'landing',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nps_responses (
      id SERIAL PRIMARY KEY,
      score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 10),
      comment VARCHAR(500),
      email VARCHAR(120),
      source VARCHAR(60) NOT NULL DEFAULT 'encuesta-nps',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id BIGSERIAL PRIMARY KEY,
      type VARCHAR(20) NOT NULL,
      visitor_id VARCHAR(40) NOT NULL,
      session_id VARCHAR(40) NOT NULL,
      path VARCHAR(200),
      referrer VARCHAR(300),
      utm_source VARCHAR(100),
      utm_medium VARCHAR(100),
      utm_campaign VARCHAR(100),
      device VARCHAR(10),
      label VARCHAR(100),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await pool.query(`CREATE INDEX IF NOT EXISTS events_type_created_idx ON events (type, created_at)`)
}

// Límite simple por IP. Cada ruta tiene su propio contador y ventana de 15 minutos.
const WINDOW_MS = 15 * 60 * 1000
const limiters = []

function rateLimit(max, message = 'Demasiados intentos. Intenta más tarde.') {
  const hits = new Map()
  limiters.push(hits)
  return (req, res, next) => {
    const now = Date.now()
    const entry = hits.get(req.ip)
    if (!entry || now - entry.start > WINDOW_MS) {
      hits.set(req.ip, { start: now, count: 1 })
      return next()
    }
    if (++entry.count > max) {
      return res.status(429).json({ ok: false, error: message })
    }
    next()
  }
}

setInterval(() => {
  const now = Date.now()
  for (const hits of limiters) for (const [ip, entry] of hits) if (now - entry.start > WINDOW_MS) hits.delete(ip)
}, WINDOW_MS).unref()

const formLimit = rateLimit(10) // registros y encuestas
const eventLimit = rateLimit(120) // eventos de visitas (incluye el pulso cada 30 s)
const loginLimit = rateLimit(10, 'Demasiados intentos de acceso. Espera 15 minutos.')
const adminLimit = rateLimit(400) // el panel en vivo consulta cada pocos segundos

const PANEL_OFF = 'Panel deshabilitado: define ADMIN_PASSWORD_HASH en las variables de Railway.'

function requireAdmin(req, res, next) {
  if (!adminEnabled) return res.status(503).json({ ok: false, error: PANEL_OFF })
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!verifySession(token)) return res.status(401).json({ ok: false, error: 'Sesión vencida. Vuelve a entrar.' })
  next()
}

const app = express()
app.set('trust proxy', 1) // Railway está detrás de un proxy; así req.ip es la IP real.
app.use(cors({ origin: ALLOWED_ORIGINS, methods: ['POST', 'GET', 'OPTIONS'] }))
app.use(express.json({ limit: '10kb' }))

// La API no tiene páginas: estas rutas solo explican qué hay aquí si alguien la abre en el navegador.
app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'API de registros de ApartaTuEspacio',
    endpoints: { health: 'GET /health', leads: 'POST /api/leads', nps: 'POST /api/nps' },
  })
})

app.get('/api/leads', (_req, res) => {
  res.status(405).json({ ok: false, error: 'Usa POST para enviar un registro' })
})

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, db: 'up' })
  } catch {
    res.status(503).json({ ok: false, db: 'down' })
  }
})

app.post('/api/leads', formLimit, async (req, res) => {
  const lead = normalizeLead(req.body)
  const errors = validateLead(lead)
  if (Object.keys(errors).length) {
    return res.status(400).json({ ok: false, errors })
  }

  try {
    // Si el correo ya estaba registrado se actualizan sus datos en vez de duplicarlo.
    await pool.query(
      `INSERT INTO leads (name, phone, email, consent, source)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
         SET name = EXCLUDED.name, phone = EXCLUDED.phone, consent = EXCLUDED.consent, updated_at = now()`,
      [lead.name, lead.phone, lead.email, lead.consent, lead.source],
    )
    res.status(201).json({ ok: true })
  } catch (err) {
    console.error('Error guardando lead:', err.message)
    res.status(500).json({ ok: false, error: 'No se pudo guardar el registro' })
  }
})

app.post('/api/nps', formLimit, async (req, res) => {
  const nps = normalizeNps(req.body)
  const errors = validateNps(nps)
  if (Object.keys(errors).length) {
    return res.status(400).json({ ok: false, errors })
  }

  try {
    await pool.query(
      `INSERT INTO nps_responses (score, comment, email, source) VALUES ($1, $2, $3, $4)`,
      [nps.score, nps.comment || null, nps.email || null, nps.source],
    )
    res.status(201).json({ ok: true })
  } catch (err) {
    console.error('Error guardando NPS:', err.message)
    res.status(500).json({ ok: false, error: 'No se pudo guardar la respuesta' })
  }
})

// La landing envía los eventos como text/plain para evitar la petición previa (preflight) de CORS.
app.post('/api/events', eventLimit, express.text({ type: 'text/plain', limit: '2kb' }), async (req, res) => {
  // Solo la landing publicada: el navegador siempre envía Origin en estas peticiones entre sitios.
  if (!EVENT_ORIGINS.includes(req.get('origin'))) return res.status(403).json({ ok: false, error: 'Origen no permitido' })
  if (isBot(req.get('user-agent'))) return res.status(204).end()
  const event = normalizeEvent(req.body)
  if (!event) return res.status(400).json({ ok: false, error: 'Evento inválido' })

  try {
    await pool.query(
      `INSERT INTO events (type, visitor_id, session_id, path, referrer, utm_source, utm_medium, utm_campaign, device, label)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [event.type, event.visitorId, event.sessionId, event.path, event.referrer, event.utmSource,
        event.utmMedium, event.utmCampaign, event.device, event.label],
    )
    res.status(204).end()
  } catch (err) {
    console.error('Error guardando evento:', err.message)
    res.status(500).json({ ok: false })
  }
})

// ---------- Panel privado de métricas ----------
// La página no contiene datos: los pide a /api/admin/metrics con la contraseña.
app.get('/admin', (_req, res) => {
  res.set({ 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' })
  res.sendFile(ADMIN_PAGE)
})

app.post('/api/admin/login', loginLimit, express.json({ limit: '1kb' }), (req, res) => {
  if (!adminEnabled) return res.status(503).json({ ok: false, error: PANEL_OFF })
  if (!verifyPassword(req.body?.password)) return res.status(401).json({ ok: false, error: 'Contraseña incorrecta' })
  res.set('Cache-Control', 'no-store').json({ ok: true, token: createSession() })
})

// Datos en vivo: se consultan cada pocos segundos desde el panel.
app.get('/api/admin/live', adminLimit, requireAdmin, async (_req, res) => {
  try {
    res.set('Cache-Control', 'no-store')
    res.json({ ok: true, ...(await getLive(pool)) })
  } catch (err) {
    console.error('Error en datos en vivo:', err.message)
    res.status(500).json({ ok: false, error: 'No se pudieron leer los datos en vivo' })
  }
})

app.get('/api/admin/metrics', adminLimit, requireAdmin, async (req, res) => {
  const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30
  try {
    res.set('Cache-Control', 'no-store')
    res.json({ ok: true, ...(await getMetrics(pool, days)) })
  } catch (err) {
    console.error('Error calculando métricas:', err.message)
    res.status(500).json({ ok: false, error: 'No se pudieron calcular las métricas' })
  }
})

// JSON mal formado u otros errores de Express
app.use((err, _req, res, _next) => {
  const status = err.status || 500
  res.status(status).json({ ok: false, error: status === 400 ? 'Solicitud inválida' : 'Error interno' })
})

ensureSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`API de ApartaTuEspacio escuchando en el puerto ${PORT}`))
  })
  .catch((err) => {
    console.error('No se pudo preparar la base de datos:', err.message)
    process.exit(1)
  })
