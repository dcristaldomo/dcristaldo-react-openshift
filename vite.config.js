import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: [
      'mi-frontend-daniela-cristaldo-playground-quarkus.apps-crc.testing',
      '.apps-crc.testing' 
    ]
  }
})
