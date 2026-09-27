// Eventos anónimos de la landing: no se guarda la IP ni datos personales, solo un id aleatorio
// del navegador (visitor_id) y de la pestaña (session_id) generados en el cliente.
// heartbeat: pulso cada 30 s mientras la pestaña está visible (visitantes activos y tiempo en la página)
export const EVENT_TYPES = ['pageview', 'form_view', 'cta_click', 'lead', 'heartbeat']
const ID_RE = /^[A-Za-z0-9-]{8,40}$/
const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|headless|lighthouse|pingdom|curl|wget/i
const DEVICES = ['mobile', 'tablet', 'desktop']

const str = (v, max) => {
  const s = String(v ?? '').trim()
  return s ? s.slice(0, max) : null
}

export const isBot = (userAgent = '') => !userAgent || BOT_RE.test(userAgent)

// Solo se miden visitas de la landing publicada de ApartaTuEspacio, no de otras páginas ni de pruebas locales.
export const EVENT_ORIGINS = (process.env.EVENT_ORIGINS || 'https://santiagoangel04.github.io')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
const LANDING_PATH = (process.env.LANDING_PATH || '/ApartaTuEspacio/').replace(/\/?$/, '/')
const isLandingPath = (path) => [LANDING_PATH, LANDING_PATH.slice(0, -1), `${LANDING_PATH}index.html`].includes(path)

/** Devuelve el evento listo para guardar, o null si no es válido. */
export function normalizeEvent(raw) {
  let body = raw
  if (typeof raw === 'string') {
    try {
      body = JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (!body || typeof body !== 'object') return null
  if (!EVENT_TYPES.includes(body.type)) return null
  if (!ID_RE.test(body.visitorId ?? '') || !ID_RE.test(body.sessionId ?? '')) return null
  if (!isLandingPath(body.path)) return null

  return {
    type: body.type,
    visitorId: body.visitorId,
    sessionId: body.sessionId,
    path: body.path,
    referrer: str(body.referrer, 300),
    utmSource: str(body.utmSource, 100)?.toLowerCase() ?? null,
    utmMedium: str(body.utmMedium, 100)?.toLowerCase() ?? null,
    utmCampaign: str(body.utmCampaign, 100),
    device: DEVICES.includes(body.device) ? body.device : null,
    label: str(body.label, 100),
  }
}

const TZ = 'America/Bogota'
const SINCE = `now() - make_interval(days => $1)`

/** Métricas del panel privado para los últimos `days` días. */
export async function getMetrics(pool, days) {
  const q = (sql, params = [days]) => pool.query(sql, params).then((r) => r.rows)

  const [[totals], [leadTotals], daily, sources, devices, ctas, recentLeads, [first], [time]] =
    await Promise.all([
      q(`SELECT
           COUNT(*) FILTER (WHERE type = 'pageview')::int AS pageviews,
           COUNT(DISTINCT visitor_id) FILTER (WHERE type = 'pageview')::int AS visitors,
           COUNT(DISTINCT session_id) FILTER (WHERE type = 'pageview')::int AS sessions,
           COUNT(DISTINCT visitor_id) FILTER (WHERE type = 'form_view')::int AS form_viewers,
           COUNT(DISTINCT visitor_id) FILTER (WHERE type = 'cta_click')::int AS cta_clickers,
           COUNT(*) FILTER (WHERE type = 'cta_click')::int AS cta_clicks
         FROM events WHERE created_at >= ${SINCE}`),
      q(`SELECT
           COUNT(*) FILTER (WHERE created_at >= ${SINCE})::int AS in_range,
           COUNT(*)::int AS all_time
         FROM leads`),
      q(`SELECT to_char(d, 'YYYY-MM-DD') AS day,
           (SELECT COUNT(DISTINCT visitor_id) FROM events e
             WHERE e.type = 'pageview' AND (e.created_at AT TIME ZONE '${TZ}')::date = d::date)::int AS visitors,
           (SELECT COUNT(*) FROM events e
             WHERE e.type = 'pageview' AND (e.created_at AT TIME ZONE '${TZ}')::date = d::date)::int AS pageviews,
           (SELECT COUNT(*) FROM leads l
             WHERE (l.created_at AT TIME ZONE '${TZ}')::date = d::date)::int AS leads
         FROM generate_series(
           ((now() AT TIME ZONE '${TZ}')::date - ($1::int - 1))::timestamp,
           (now() AT TIME ZONE '${TZ}')::date::timestamp,
           interval '1 day') AS d
         ORDER BY d`),
      q(`SELECT source, COUNT(DISTINCT visitor_id)::int AS visitors FROM (
           SELECT visitor_id,
             COALESCE(utm_source, substring(referrer from '^https?://(?:www\\.)?([^/:?#]+)'), 'Directo') AS source
           FROM events WHERE type = 'pageview' AND created_at >= ${SINCE}
         ) s GROUP BY source ORDER BY visitors DESC, source LIMIT 10`),
      q(`SELECT COALESCE(device, 'desconocido') AS device, COUNT(DISTINCT visitor_id)::int AS visitors
         FROM events WHERE type = 'pageview' AND created_at >= ${SINCE}
         GROUP BY 1 ORDER BY visitors DESC`),
      q(`SELECT COALESCE(label, 'Sin etiqueta') AS label, COUNT(*)::int AS clicks
         FROM events WHERE type = 'cta_click' AND created_at >= ${SINCE}
         GROUP BY 1 ORDER BY clicks DESC LIMIT 10`),
      q(`SELECT name, email, phone, created_at FROM leads ORDER BY created_at DESC LIMIT 50`, []),
      q(`SELECT MIN(created_at) AS first_event FROM events`, []),
      // Duración de cada sesión = del primer al último evento (el pulso llega cada 30 s)
      q(`SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (last_at - first_at)))), 0)::int AS avg_seconds
         FROM (SELECT MIN(created_at) AS first_at, MAX(created_at) AS last_at
               FROM events WHERE created_at >= ${SINCE} GROUP BY session_id) s`),
    ])

  return {
    days,
    generatedAt: new Date().toISOString(),
    trackingSince: first.first_event,
    totals: { ...totals, leads: leadTotals.in_range, leadsAllTime: leadTotals.all_time, avgSeconds: time.avg_seconds },
    daily,
    sources,
    devices,
    ctas,
    recentLeads,
  }
}

// Fuente de una visita: utm_source, sitio de origen o «Directo»
const SOURCE_SQL = `COALESCE(utm_source, substring(referrer from '^https?://(?:www\.)?([^/:?#]+)'), 'Directo')`
// Una persona cuenta como activa si su navegador envió algún evento (o pulso) en los últimos 90 s
const ACTIVE_WINDOW = `interval '90 seconds'`

/** Datos en tiempo real para el panel: se consultan cada pocos segundos. */
export async function getLive(pool) {
  const q = (sql) => pool.query(sql).then((r) => r.rows)
  const [active, [today], perMinute, feed] = await Promise.all([
    q(`SELECT s.session_id, s.device, s.started_at, s.last_at, s.source
       FROM (
         SELECT session_id,
           (ARRAY_AGG(device ORDER BY created_at DESC))[1] AS device,
           MIN(created_at) AS started_at,
           MAX(created_at) AS last_at,
           (ARRAY_AGG(${SOURCE_SQL} ORDER BY created_at) FILTER (WHERE type = 'pageview'))[1] AS source
         FROM events
         WHERE created_at >= now() - interval '2 hours'
         GROUP BY session_id
       ) s
       WHERE s.last_at >= now() - ${ACTIVE_WINDOW}
       ORDER BY s.started_at DESC LIMIT 50`),
    q(`SELECT
         (SELECT COUNT(DISTINCT visitor_id) FROM events
           WHERE type = 'pageview' AND (created_at AT TIME ZONE '${TZ}')::date = (now() AT TIME ZONE '${TZ}')::date)::int AS visitors,
         (SELECT COUNT(*) FROM events
           WHERE type = 'pageview' AND (created_at AT TIME ZONE '${TZ}')::date = (now() AT TIME ZONE '${TZ}')::date)::int AS pageviews,
         (SELECT COUNT(*) FROM leads
           WHERE (created_at AT TIME ZONE '${TZ}')::date = (now() AT TIME ZONE '${TZ}')::date)::int AS leads`),
    // Personas activas por minuto en los últimos 30 minutos
    q(`SELECT to_char(m AT TIME ZONE '${TZ}', 'HH24:MI') AS minute,
         (SELECT COUNT(DISTINCT visitor_id) FROM events e
           WHERE e.created_at >= m AND e.created_at < m + interval '1 minute')::int AS visitors
       FROM generate_series(date_trunc('minute', now()) - interval '29 minutes', date_trunc('minute', now()), interval '1 minute') AS m
       ORDER BY m`),
    q(`SELECT type, device, label, ${SOURCE_SQL} AS source, created_at
       FROM events WHERE type <> 'heartbeat'
       ORDER BY created_at DESC LIMIT 20`),
  ])

  return { generatedAt: new Date().toISOString(), activeNow: active.length, active, today, perMinute, feed }
}
