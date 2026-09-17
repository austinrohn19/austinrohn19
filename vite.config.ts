import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative asset paths so the build works at any URL (GitHub Pages, Express, local file)
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5177',
    },
  },
})
