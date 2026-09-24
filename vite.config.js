import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En GitHub Pages el sitio vive en https://<usuario>.github.io/ApartaTuEspacio/,
// así que los archivos deben pedirse desde ese subdirectorio. En local, Vercel o Netlify se usa la raíz.
const base = process.env.GITHUB_ACTIONS ? '/ApartaTuEspacio/' : '/'

export default defineConfig({
  base,
  plugins: [react()],
})
