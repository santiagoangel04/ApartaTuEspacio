// Genera una contraseña nueva para el panel /admin y su hash scrypt.
// Uso (desde la carpeta server):  node scripts/new-admin-password.mjs
// No guarda nada en disco: copia la contraseña en un lugar seguro y el hash en la variable
// ADMIN_PASSWORD_HASH del servicio en Railway. Al cambiarla, se cierran todas las sesiones abiertas.
import { randomBytes, randomInt, scryptSync } from 'node:crypto'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789' // sin 0/O, 1/l/I
const group = () => Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
const password = [group(), group(), group(), group()].join('-')

const N = 32768
const r = 8
const p = 1
const salt = randomBytes(16)
const hash = scryptSync(password, salt, 64, { N, r, p, maxmem: 256 * N * r })

console.log('\nContraseña del panel (guárdala en un lugar seguro):')
console.log(`  ${password}\n`)
console.log('Valor para ADMIN_PASSWORD_HASH en Railway:')
console.log(`  scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${hash.toString('base64')}\n`)
