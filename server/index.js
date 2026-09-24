import express from 'express'
import cors from 'cors'
import pg from 'pg'
import { normalizeLead, validateLead } from './validation.js'

const PORT = process.env.PORT || 3000
// En Railway se define como referencia al servicio de Postgres: ${{Postgres.DATABASE_URL}}
const DATABASE_URL = process.env.DATABASE_URL
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
}

// Límite simple por IP para frenar envíos masivos: 10 registros cada 15 minutos.
const WINDOW_MS = 15 * 60 * 1000
const MAX_PER_WINDOW = 10
const hits = new Map()

function rateLimit(req, res, next) {
  const now = Date.now()
  const entry = hits.get(req.ip)
  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(req.ip, { start: now, count: 1 })
    return next()
  }
  if (++entry.count > MAX_PER_WINDOW) {
    return res.status(429).json({ ok: false, error: 'Demasiados intentos. Intenta más tarde.' })
  }
  next()
}

setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of hits) if (now - entry.start > WINDOW_MS) hits.delete(ip)
}, WINDOW_MS).unref()

const app = express()
app.set('trust proxy', 1) // Railway está detrás de un proxy; así req.ip es la IP real.
app.use(cors({ origin: ALLOWED_ORIGINS, methods: ['POST', 'GET', 'OPTIONS'] }))
app.use(express.json({ limit: '10kb' }))

// La API no tiene páginas: estas rutas solo explican qué hay aquí si alguien la abre en el navegador.
app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'API de registros de ApartaTuEspacio',
    endpoints: { health: 'GET /health', leads: 'POST /api/leads' },
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

app.post('/api/leads', rateLimit, async (req, res) => {
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
