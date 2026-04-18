import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    base: mode === 'production' ? '/Pawin-PyPOS/' : '/',
    server: {
      host: true,
      allowedHosts: [
        'bronchially-muggier-clementina.ngrok-free.dev',
        'localhost',
        '127.0.0.1'
      ]
    }
  }
})
