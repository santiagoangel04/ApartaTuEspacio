import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import { normalizeLead, validateLead } from './validation.js'

const PORT = process.env.PORT || 3000
// Railway inyecta MYSQL_URL al referenciar la base de datos: ${{MySQL.MYSQL_URL}}
const DATABASE_URL = process.env.MYSQL_URL || process.env.DATABASE_URL
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://santiagoangel04.github.io,http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

if (!DATABASE_URL) {
  console.error('Falta la variable MYSQL_URL con la conexión a MySQL.')
  process.exit(1)
}

const pool = mysql.createPool({ uri: DATABASE_URL, connectionLimit: 5, waitForConnections: true })

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(60) NOT NULL,
      phone VARCHAR(10) NOT NULL,
      email VARCHAR(120) NOT NULL,
      consent TINYINT(1) NOT NULL DEFAULT 1,
      source VARCHAR(60) NOT NULL DEFAULT 'landing',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_email (email)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
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
    await pool.execute(
      `INSERT INTO leads (name, phone, email, consent, source)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone), consent = VALUES(consent)`,
      [lead.name, lead.phone, lead.email, lead.consent ? 1 : 0, lead.source],
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
