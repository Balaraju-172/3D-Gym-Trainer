import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const animationAssetsPlugin = {
  name: 'copy-runtime-animation-assets',
  apply: 'build',
  closeBundle() {
    const source = fileURLToPath(new URL('./animations', import.meta.url))
    const destination = fileURLToPath(new URL('./dist/animations', import.meta.url))
    mkdirSync(destination, { recursive: true })
    cpSync(source, destination, { recursive: true })
  },
}

export default defineConfig({
  plugins: [react(), animationAssetsPlugin],
  server: { host: '0.0.0.0' },
})
