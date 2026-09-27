import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto'

/**
 * Acceso al panel privado.
 *
 * La contraseña NO está en el código ni en el repositorio: Railway guarda solo su hash scrypt en la
 * variable ADMIN_PASSWORD_HASH, con el formato  scrypt$N$r$p$<sal base64>$<hash base64>.
 * Con el hash no se puede recuperar la contraseña.
 *
 * Al entrar, la contraseña se cambia por un token de sesión firmado (HMAC) que vence en 12 horas,
 * así el navegador nunca guarda la contraseña. Cambiar la contraseña invalida todas las sesiones.
 */
const SESSION_MS = 12 * 60 * 60 * 1000

function parseHash(value) {
  const parts = (value || '').trim().split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return null
  const [, N, r, p, salt, hash] = parts
  const params = { N: Number(N), r: Number(r), p: Number(p) }
  if (!Object.values(params).every(Number.isInteger)) return null
  return { params, salt: Buffer.from(salt, 'base64'), hash: Buffer.from(hash, 'base64') }
}

const stored = parseHash(process.env.ADMIN_PASSWORD_HASH)
export const adminEnabled = Boolean(stored && stored.salt.length >= 16 && stored.hash.length >= 32)

// La clave que firma las sesiones se deriva del hash: no hace falta otra variable.
const signingKey = adminEnabled ? createHmac('sha256', stored.hash).update('ate-admin-session').digest() : null

export function verifyPassword(password) {
  if (!adminEnabled || typeof password !== 'string' || !password || password.length > 200) return false
  const { N, r, p } = stored.params
  const candidate = scryptSync(password, stored.salt, stored.hash.length, { N, r, p, maxmem: 256 * N * r })
  return timingSafeEqual(candidate, stored.hash)
}

const b64url = (buf) => Buffer.from(buf).toString('base64url')
const sign = (data) => createHmac('sha256', signingKey).update(data).digest()

export function createSession() {
  const payload = b64url(JSON.stringify({ exp: Date.now() + SESSION_MS }))
  return `${payload}.${b64url(sign(payload))}`
}

export function verifySession(token) {
  if (!adminEnabled || typeof token !== 'string') return false
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false
  const expected = sign(payload)
  const given = Buffer.from(signature, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now()
  } catch {
    return false
  }
}
